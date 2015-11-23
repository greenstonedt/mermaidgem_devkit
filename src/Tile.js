import ui.View;
import ui.ImageView;
import ui.ViewPool as ViewPool;
import animate;
import math.geom.Point as Point;
import ui.SpriteView as SpriteView;
import src.Board as Board;

function animSelectionStart()
{
    animate(this.tileImage).clear().now({r: Math.PI * 2, zIndex: 1000.0}, 500, animate.linear).then({r: 0.0}, 0, animate.linear).then(animSelectionStart.bind(this));        
}

function animSelectionEnd()
{
    var destRotation = this.type <= GLOBAL.tileTypeCount ? (Math.PI * 2) : (Math.PI * 2.25);
    animate(this.tileImage).clear().now({r: destRotation}, 500 * (destRotation - this.style.r) / destRotation, animate.easeOut).then({r: destRotation % Math.PI}, 0, animate.linear).then({zIndex: 0.0});          
}

exports = Class(ui.View, function(supr) {
   
    this.init = function(opts)
    {         
        supr(this, 'init', [opts]);                
        
        this.tileImage = new ui.ImageView({  
            superview: this,
        });
        this.spriteView = new SpriteView({
            superview: this,
            offsetX: -GLOBAL.tileWidth * 0.25,
            offsetY: -GLOBAL.tileHeight * 0.25,
            frameRate: 10,
            url: "resources/images/sprite/mermaid",
        });                             
    };  
    
    this.onObtain = function(opts)
    {        
        animate(this).clear();        
        
        this.type = opts.type;
        this._flag = this.TileBitwiseFlag();
        this.row = opts.row;
        this.col = opts.col; 
        
        if (this.type != GLOBAL.tileTypeMermaidID)
        {
            if (this.type > GLOBAL.tileTypeCount)
            {
                this.tileImage.style.update({
                    anchorX: GLOBAL.tileWidth * 0.375,
                    anchorY: GLOBAL.tileHeight * 0.375,
                    width: GLOBAL.tileWidth * 0.75,
                    height: GLOBAL.tileHeight * 0.75,
                    offsetX: GLOBAL.tileWidth * 0.125,
                    offsetY: GLOBAL.tileHeight * 0.125,
                });
            }
            else
            {
                this.tileImage.style.update({
                    anchorX: GLOBAL.tileWidth * 0.5,
                    anchorY: GLOBAL.tileHeight * 0.5,
                    width: GLOBAL.tileWidth,
                    height: GLOBAL.tileHeight,
                    offsetX: 0,
                    offsetY: 0,
                });
            }
            this.tileImage.setImage("resources/images/sprite/icon_block_0" + (this.type % (GLOBAL.tileTypeCount + 1)  + (this.type > GLOBAL.tileTypeCount ? 1 : 0)) + ".png");
            this.tileImage.style.visible = true;
            this.spriteView.style.visible = false;

            animSelectionEnd.call(this);
        }
        else
        {
            this.spriteView.style.update({
                anchorX: GLOBAL.tileWidth * 0.5,
                anchorY: GLOBAL.tileHeight * 0.5,
                width: GLOBAL.tileWidth * 1.5,
                height: GLOBAL.tileHeight * 1.5,
            });
            this.tileImage.style.visible = false;
            this.spriteView.style.visible = true;
            this.spriteView.startAnimation("blink", {loop: true});
        }
        this.style.visible = true;
                
        var pos = this.getPosition();                        
        if (opts.isFalling)
        {
            this.style.x = pos.x;
            this.style.y = pos.y - GLOBAL.boardSize * 1.25;        
            this.Drop();    
        }
        else
        {
            this.style.x = pos.x;
            this.style.y = pos.y; 
        }
    }
    
    this.TileBitwiseFlag = function()
    {
        return (this.type < GLOBAL.tileTypeMermaidID) ? (1 << (this.type % (GLOBAL.tileTypeCount + 1) + (this.type > GLOBAL.tileTypeCount ? 1 : 0))) : 0x0;
    }
    
    this.isMatched = function(destTile)
    {
        return ((this._flag & destTile._flag) != 0);
    } 

    this.Drop = function()
    {
        var pos = this.getPosition();                        
        
        animate(this).clear().now({x: pos.x, y: pos.y}, 400, animate.easeIn);
    }
    
    this.animateSelection = function()
    {
        if (this.tileImage)
        {
            animSelectionStart.call(this);            
        }
    }
    
    this.animateUnselection = function()
    {   
        if (this.tileImage)
        {
            animSelectionEnd.call(this);
        }
    }
    
    this.SwapBack = function(destTile)
    {
        var pos = this.getPosition();
        var destPos = destTile.getPosition();
        
        animate(this).clear().now({x: destPos.x, y: destPos.y}, 200, animate.linear).then({x: pos.x, y: pos.y}, 200, animate.linear);
    }
    
    this.Swap = function(destTile)
    {        
        var myPosition = this.getPosition();
        var destPos = destTile.getPosition();
        
        animate(this).clear().now({x: destPos.x, y: destPos.y}, 200, animate.linear);
        
        animate(destTile).clear().now({x: myPosition.x, y: myPosition.y}, 200, animate.linear);
        
        var temp = this.row;
        this.row = destTile.row;
        destTile.row = temp;
        
        temp = this.col;
        this.col = destTile.col;
        destTile.col = temp;
    }
    
    this.getPosition = function()
    {
        var x = this.col * GLOBAL.tileWidth;
        var y = this.row * GLOBAL.tileHeight;
        return new Point(x, y);
    }
});
