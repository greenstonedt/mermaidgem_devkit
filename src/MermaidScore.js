import ui.View;
import ui.ImageView;
import ui.ViewPool as ViewPool;
import animate;
import math.geom.Point as Point;
import ui.SpriteView as SpriteView;   

exports = Class(ui.ImageView, function(supr) {
   
    this.init = function(opts)
    {         
        supr(this, 'init', [opts]);     
    };  

    this.onObtain = function(opts)
    {   
        this.style.x = opts.x;
        this.style.y = opts.y;
        this.style.visible = true;

        this.spriteView = new SpriteView({
            superview: this,
            frameRate: 10,
            width: 132,
            height: 132,
            url: "resources/images/sprite/mermaid",
        });                                       

        this.spriteView.startAnimation("idle", {loop: true});  
        this.spriteView.style.visible = true;  


        animate(this).clear()
            .now({x: opts.destX, y: opts.destY}, 1000, animate.linear);
    };
});