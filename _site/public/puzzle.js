(function(window, document, undefined){
	var 	image = new Image(),
			div = document.getElementById("puzzle"),
			statusP,
			scale = 80,
			invScale = 1.0 / scale,
			ROWS = 3,
			COLS = 3,
			tiles = [],
			SPRITE_SHEET = "url('/public/1to9.png')",
			GRID_IMAGE = "url('/public/grid.png')",
			mouseX,
			mouseY,
			offsetX,
			offsetY,
			interpolation = 0.5,
			revealedTile,
			revealCount = 0,
			animating = false;
	
	/* Sprite
	 *
	 * A css Sprite:
	 * sheet is the sprite-sheet which this object will be using to render the
	 * sprite. So sheetX and sheetY is the top left hand corner of the area we're
	 * grabbing. dx and dy are used optionally to place the sprite off-center
	 */
	function Sprite(x, y, sheet, sheetX, sheetY, width, height, dx, dy, maskRect){
		this.x = x;
		this.y = y;
		this.sheetX = sheetX;
		this.sheetY = sheetY;
		this.width = width;
		this.height = height;
		this.dx = dx || 0;
		this.dy = dy || 0;
		this.div = document.createElement("div");
		this.div.style.backgroundImage = sheet;
		this.div.style.backgroundPosition = (-sheetX) + "px " + (-sheetY) + "px";
		this.div.style.position = "absolute";
		this.div.style.width = width;
		this.div.style.height = height;
		this.maskRect = maskRect;
	}
	Sprite.prototype = {
		// updates the sprite position
		update: function(x, y){
			x = x ? parseInt(x) : this.x;
			y = y ? parseInt(y) : this.y;
			var posX = this.dx + x;
			var posY = this.dy + y;
			if(this.maskRect){
				
				// if inside the masking area - business as usual
				if(posX >= this.maskRect.x && posY >= this.maskRect.y && posX + this.width < this.maskRect.x + this.maskRect.width && posY + this.height < this.maskRect.x + this.maskRect.height){
					this.div.style.backgroundPosition = (-this.sheetX) + "px " + (-this.sheetY) + "px";
					this.div.style.width = this.width;
					this.div.style.height = this.height;
				
				// else clip the width and move the sheet reference to mask the
				// sprite with in the rectangle maskRect
				} else {
					this.div.style.width = Math.abs(Math.max(this.maskRect.x, posX) - Math.min(this.maskRect.x + this.maskRect.width, posX + this.width));
					this.div.style.height = Math.abs(Math.max(this.maskRect.y, posY) - Math.min(this.maskRect.y + this.maskRect.height, posY + this.height));
					var sheetPosX = -this.sheetX + (posX < this.maskRect.x ? posX - maskRect.x : 0);
					var sheetPosY = -this.sheetY + (posY < this.maskRect.y ? posY - maskRect.y: 0);
					this.div.style.backgroundPosition = sheetPosX + "px " + sheetPosY + "px";
					if(posX < this.maskRect.x) posX = this.maskRect.x;
					if(posY < this.maskRect.y) posY = this.maskRect.y;
				}
			}
			this.div.style.left = offsetX + posX;
			this.div.style.top = offsetY + posY;
		
			this.div.style.left = offsetX + posX;
			this.div.style.top = offsetY + posY;
		}
	}
	// calculates offset (needed to render relative to an element)
	function getOffset(element){
		offsetX = offsetY = 0;
		if(element.offsetParent){
			do{
				offsetX += element.offsetLeft;
				offsetY += element.offsetTop;
			} while ((element = element.offsetParent));
		}
	}
	/* Tile
	 *
	 * A tile in a sliding tile puzzle
	 */
	Tile.prototype = new Sprite();
	Tile.prototype.constructor = Tile;
	Tile.prototype.parent = Sprite.prototype;
	function Tile(r, c, sheet, maskRect){
		Sprite.call(this, c * scale, r * scale, sheet, c * scale, r * scale, scale, scale, 0, 0, maskRect);
		this.slideX = this.x;
		this.slideY = this.y;
		this.r = r;
		this.c = c;
	}
	Tile.prototype.copy = function(){
		var tile = new Tile(this.r, this.c, this.div.style.backgroundImage, this.maskRect);
		tile.x = this.x;
		tile.y = this.y;
		tile.slideX = this.slideX;
		tile.slideY = this.slideY;
		return tile;
	}
	
	// mouse listeners
	function mouseDown(e){
		if(!animating){
			revealedTile = tiles[mouseRow()][mouseCol()];
			if(revealedTile.maskRect.height == 0){
				revealTile();
			} else {
				revealedTile = undefined;
			}
		}
	}
	
	// update the text underneath the puzzle showing how complete it is
	function updateCompletionStatus(){
		var c = complete();
		if(c == ROWS * COLS){
			statusP.innerHTML = "Great Success!";
		} else {
			var p = ((100 / (ROWS * COLS)) * c) >> 0;
			statusP.innerHTML = p + "% Complete";
		}
	}
	
	function mouseMove(e){
		mouseX = 0;
		mouseY = 0;
		e = e || window.event;
		if(e.pageX || e.pageY){
			mouseX = e.pageX;
			mouseY = e.pageY;
		} else if (e.clientX || e.clientY){
			mouseX = e.clientX + document.body.scrollLeft
				+ document.documentElement.scrollLeft;
			mouseY = e.clientY + document.body.scrollTop
				+ document.documentElement.scrollTop;
		}
	}
	
	// Called to prep the tiles
	function initTiles(){
		getOffset(div);
		var r, c, maskRect;
		for(r = 0; r < ROWS; r++){
			tiles[r] = [];
			for(c = 0; c < COLS; c++){
				maskRect = {x:c * scale, y:r * scale, width:scale, height:scale};
				tiles[r][c] = new Tile(r, c, SPRITE_SHEET, maskRect);
				tiles[r][c].update();
				div.appendChild(tiles[r][c].div);
			}
		}
		randomiseTiles();
		for(r = 0; r < ROWS; r++){
			for(c = 0; c < COLS; c++){
				tiles[r][c].maskRect.height = 0;
				tiles[r][c].update();
			}
		}
	}
	
	function mouseCol(){
		return ((mouseX - offsetX) * invScale) >> 0;
	}
	
	function mouseRow(){
		return ((mouseY - offsetY) * invScale) >> 0;
	}
	
	// reveal a tile by sliding it open
	function revealTile(){
		animating = true;
		var vy = (scale - revealedTile.maskRect.height) * interpolation;
		var update = true;
		if(vy < interpolation){
			revealedTile.maskRect.height = scale;
			update = false;
		} else {
			revealedTile.maskRect.height += vy;
		}
		revealedTile.update();
		
		if(update) setTimeout(revealTile, 50);
		else{
			updateCompletionStatus();
			if(revealCount != revealedTile.c + revealedTile.r * COLS){
				hideTiles();
			} else {
				revealCount++;
				animating = false;
			}
			revealedTile = undefined;
		}
	}
	
	// hides all tiles
	function hideTiles(){
		animating = true;
		var r, c, tile;
		for(r = 0; r < ROWS; r++){
			for(c = 0; c < COLS; c++){
				tile = tiles[r][c];
				if(tile.maskRect.height < interpolation){
					tile.maskRect.height = 0;
				} else {
					tile.maskRect.height *= interpolation;
				}
				tile.update();
			}
		}
		if(complete() > 0){
			setTimeout(hideTiles, 50);
		} else {
			revealCount = 0;
			animating = false;
		}
	}
	
	// Returns the number of tiles that are in their home position
	function complete(){
		var r, c;
		var total = 0;
		for(r = 0; r < ROWS; r++){
			for(c = 0; c < COLS; c++){
				if(tiles[r][c].maskRect.height > 0) total++;
			}
		}
		return total;
	}
	
	// Randomises the tile positions
	function randomiseTiles(){
		var tile, ar, ac, br, bc;
		for(var i = 0; i < 20; i++){
			ar = (Math.random() * ROWS) >> 0;
			ac = (Math.random() * COLS) >> 0;
			br = (Math.random() * ROWS) >> 0;
			bc = (Math.random() * COLS) >> 0;
			if(tiles[ar][ac] != tiles[br][bc]){
				tile = tiles[ar][ac];
				tile.x = bc * scale;
				tile.y = br * scale;
				tile.maskRect.x = tile.x;
				tile.maskRect.y = tile.y;
				tile = tiles[br][bc];
				tile.x = ac * scale;
				tile.y = ar * scale;
				tile.maskRect.x = tile.x;
				tile.maskRect.y = tile.y;
				tiles[br][bc] = tiles[ar][ac];
				tiles[ar][ac] = tile;
				tiles[ar][ac].update();
				tiles[br][bc].update();
			}
		}
	}
	
	// Initialisation from this point in
	function init(){
		if(imageList.length){
			image.src = imageList.shift();
			image.onload = init;
			return;
		}
		div.innerHTML = "";
		div.style.width = COLS * scale;
		div.style.height = ROWS * scale;
		div.style.backgroundImage = GRID_IMAGE;
		initTiles();
		div.addEventListener("mousedown", mouseDown, false);
		div.addEventListener("mousemove", mouseMove, false);
		statusP = document.createElement("p");
		div.parentNode.appendChild(statusP);
		updateCompletionStatus();
	}
	var imageList = ["1to9.png", "grid.png"];
	image.onload = init;
	image.src = imageList.shift();
	
}(this, this.document))
