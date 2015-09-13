---
layout: post
title: Make Pocketsphinx recognize new words
summary: Evolve your voice recognizer program
comments: true
date: 2012-12-13
---
Now that we’ve got [pocketsphinx installed and running](http://ghatage.com/2012/09/16/voice-to-text-pocketsphinx/), we’d like for it to recognize the words we want it to.
By default, the vocabulary and the dictionary it has may not cut it. in fact, if you’ve tried pocketsphinx_continuous you’ll understand that it cannot recognize half of the words you say.

Is it because of your accent?
Is it because of your mic?
There are many factors, but right now we’ll take a look at the quickest way for pocketsphinx to actually, quickly, recognize what you’re saying.

Let’s take a brief moment to understand what we’re going to do.

The three main arguments we give to pocketsphinx_continuous which may determine the accuracy are as follows
```
-hmm : The Acoustic Model
-lm : The Language Model
-dict : The Dictionary
```
The Acoustic Model is created by taking audio of speech and the corresponding text transcription.
Then statistical representations of the sounds that make up each word are created from this data to make the Acoustic Model.
The default acoustic model we’ve seen in my last post, the one which comes with pocketsphinx is the most optimized and comprehensive.
Hence, we don’t need to _create_ another acoustic model, we’ll just use the one we have.

The Language Model is actually a statistical language model which assigns probability to each word that it’s given using a probability distribution formula.

The Dictionary is the actual set of words which are given to the language model. The dictionary also represents how the words are pronounced.

So, since we’ll be using the default acoustic model, we can change the language model and the dictionary to add more, new words.

To do that, create a new file and add the words which you want to be specifically recognized, this will be the corpus:
```
sample.txt

Donut
Chair
Phone
Car
```

Save it, and go to the following link: http://www.speech.cs.cmu.edu/tools/lmtool.html
You can either use the tool in the given link, or, use the newer version mentioned there.
Here we’ll use the one given on the page.

Select the corpus file you’ve created, here we’ve made ‘sample.txt‘.

Build the corpus by clicking on the ‘COMPILE KNOWLEDGE BASE’ button.

You’ll see this screen after it’s done.

Right click on the ‘Dictionary’ and ‘Language Model’ links and save the files. We’ll be giving these as arguments to pocketsphinx_continuous.

Ok, now fire up your terminal, set the LD_LIBRARY_PATH if you haven’t added it to your .bashrc already and let’s get going!

As you will see here, it successfully recognizes the word ‘Car’ in the first attempt itself.

Also, it is able to recognize continuous speech when ‘Car, Donut, Phone’ are spoken out without pauses.

Now, you can use this method to build your own dictonary and make pocketsphinx recognize words that you want it to, with high accuracy.

Until then.
