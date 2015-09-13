---
layout: post
title: Voice to text using CMU Pocketsphinx
summary: Make your own voice to text program
comments: true
date: 2012-09-16
---
We’ll need to install a bunch of things to get this working.

* SphinxBase (This is required by PocketSphinx)
* PocketSphinx (This is the library which we’ll use for audio to text)
* SphinxTrain (This is used to train PocketSphinx to a local language/accent)

The installation is pretty straightforward. Just that it can make you cry at times.

It’s the dependencies that give you a problem than PocketSphinx itself.

Install the dependencies
```
sudo apt-get install libpulse-dev
```

Download the tar’s for SphinxBase,PocketSphinx and SphinxTrain and put them in one directory and extract them there.<br>
The installation steps are the same, but they should be installed in this order:<br>
Sphinxbase, PocketSphinx and SphinxTrain.<br>

```
/* Install Sphinxbase first */
cd sphinxbase-0.8/ 

./configure
make
sudo make install

/* 
** The sphinxbase will be installed in /usr/local/ folder. 
** Not every system loads libraries from this folder automatically. 
** It can be done by exporting the following environment variables:
*/
export LD_LIBRARY_PATH=/usr/local/lib
export PKG_CONFIG_PATH=/usr/local/lib/pkgconfig
/*
** It's also a good idea to put it in your .bashrc
*/

/* Now install pocketpshinx */
cd ../pocketsphinx-0.8/

./configure
make
sudo make install

/*
** You have now successfully installed PocketSphinx. 
** Let's try it out by executing this command  
*/

pocketsphinx_continuous
```

When you execute pocketsphinx_continuous it’ll show a bunch of things and then finally something like this:

Speak into your microphone and see the results!

Writing your own program using the API

Once the above installation steps are done,
Here is a sample program off the CMU tutorial for pocketsphinx.

```
#include <pocketsphinx.h>

int
main(int argc, char *argv[])
{
	ps_decoder_t *ps;
	cmd_ln_t *config;
	FILE *fh;
	char const *hyp, *uttid;
	int16 buf[512];
	int rv;
	int32 score;

	config = cmd_ln_init(NULL, ps_args(), TRUE,
			     "-hmm", MODELDIR "/hmm/en_US/hub4wsj_sc_8k",
			     "-lm", MODELDIR "/lm/en/turtle.DMP",
			     "-dict", MODELDIR "/lm/en/turtle.dic",
			     NULL);
/*
**  Alternatively, you can directly specify where the 'hmm', 'dict' and 'lm' files are
**  by directly writing their absolute path as I've done below. 
**  They're in the extracted pocketsphinx-0.8 folder/model/
**  What this will do is make your compilation command smaller but in return
**  you can't give it runtime locations for the hmm, lm and dict files
**
** config = cmd_ln_init(NULL, ps_args(), TRUE,               
** 			     "-hmm", "/home/anup/Stuff/pocketsphinx/pocketsphinx-0.8/model/hmm/en_US/hub4wsj_sc_8k",
** 			     "-lm", "/home/anup/Stuff/pocketsphinx/pocketsphinx-0.8/model/lm/en/turtle.DMP",
** 			     "-dict", "/home/anup/Stuff/pocketsphinx/pocketsphinx-0.8/model/lm/en/turtle.dic",
** 			     NULL);
*/
	if (config == NULL)
		return 1;
	ps = ps_init(config);
	if (ps == NULL)
		return 1;

	fh = fopen("goforward.raw", "rb");
	if (fh == NULL) {
		perror("Failed to open goforward.raw");
		return 1;
	}

	rv = ps_decode_raw(ps, fh, "goforward", -1);
	if (rv < 0)
		return 1;
	hyp = ps_get_hyp(ps, &score, &uttid);
	if (hyp == NULL)
		return 1;
	printf("Recognized: %s\n", hyp);

        fseek(fh, 0, SEEK_SET);
        rv = ps_start_utt(ps, "goforward");
	if (rv < 0)
		return 1;
        while (!feof(fh)) {
            size_t nsamp;
            nsamp = fread(buf, 2, 512, fh);
            rv = ps_process_raw(ps, buf, nsamp, FALSE, FALSE);
        }
        rv = ps_end_utt(ps);
	if (rv < 0)
		return 1;
	hyp = ps_get_hyp(ps, &score, &uttid);
	if (hyp == NULL)
		return 1;
	printf("Recognized: %s\n", hyp);

	fclose(fh);
        ps_free(ps);
	return 0;
}
```
Now you can compile this using the following command:
```
/* Compile the program */
gcc -o hello_ps hello_ps.c 'pkg-config --cflags --libs pocketsphinx sphinxbase'

/*
** Execute the binary
** Make sure that the audio file 'goforward.raw' is in the same 
** directory as your program otherwise it'll fail to execute.
*/
./hello_ps
```

Here is what it will look like:

Quick Tip:
```
/* Your .bashrc can have these lines to make your life easier. */
export LD_LIBRARY_PATH=/usr/local/lib
export PKG_CONFIG_PATH=/usr/local/lib/pkgconfig

/*
** Only if you're going to hard code the hmm, lm and dict file paths
** Like in the example
*/
gps()
{
    gcc -o $1.o $1 `pkg-config --cflags --libs pocketsphinx sphinxbase`
}


/*
** Now you can simply use the API by including the pocketsphinx header
** and compile the program using the command 'gps' 
*/
gps filename.c
```

I had a comment from Nickolay Shmyrev explaining about the underlying framework of the audio subsystem on Linux.
It was nice of him to take some time out and explain how it works, here is it for your reference as well.

> Hello Anup <br>
> The installation process is not an issue if you understand the complexity of audio subsystems in Linux. The audio subsystem is complex unfortunately, but once you get it things will be easier. <br>
> Historically, audio subsystem is pretty fragmented. It includes the following major frameworks: <br>
> Old Unix-like DSP framework – everything is handled by the kernel-space driver. Applications interact with /dev/dsp device to produce and record audio <br>
> ALSA – newer audio subsystem, partially in kernel but also has userspace library libasound. ALSA also provides DSP compatibliity layer through snd_pcm_oss driver which creates /dev/dsp device and emulates audio <br>
> Pulseaudio – even newer system which works on the top of libasound ALSA library but provides a sound server to centralize all the processing. To communicate with the library it also provides libpulse library which must be used by applications to record sound <br>
> Jack – another sound server, also works on the top of ALSA, provides anoher library libjack. Similar to Pulseaudio there are others not very popular frameworks, but sphinxbase doesn’t support them. Example are ESD (old GNOME sound server), ARTS (old KDE sound server), Portaudio (portable library usable across Windows, Linux and Mac). <br>
> The recommended audio framework on Ubuntu is pulseaudio. <br>
> Sphinxbase and pocketsphinx support all the frameworks and automatically selects the one you need in compile time. The highest priority is in pulseaudio framework. <br>
> Before you install sphinxbase you need to decide which framework to use. You need to setup the development part of the corresponding framework after that. <br>
> For example, it’s recommended to install libpulse-dev package to provide access to pulseaudio and after that sphinxbase will automatically work with Pulseaudio. Once you work with pulseaudio you do not need other frameworks. <br>
