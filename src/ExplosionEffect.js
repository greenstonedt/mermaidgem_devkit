import ui.View;
import ui.ViewPool as ViewPool;
import ui.ImageView;
import animate;
import math.geom.Point as Point;

import src.Tile as Tile;

exports = Class(ui.ImageView, function(supr) {
   
    this.init = function(opts)
    {               
        supr(this, 'init', [opts]);                                        
    };  

    this.onObtain = function(opts)
    {
        this.type = opts.type;                
        this.style.x = opts.x;
        this.style.y = opts.y;
        this.style.width = opts.width;
        this.style.height = opts.height;
        this.style.anchorX = opts.width * 0.5;
        this.style.anchorY = opts.height * 0.5;
        this.style.visible = true;
        
        var explosion = this;
        var urlString = "resources/images/sprite/block_0" + (this.type % (GLOBAL.tileTypeCount + 1) + (this.type > GLOBAL.tileTypeCount ? 1 : 0)) + "_pop_000";
        animate(this)
            .then(function() {explosion.setImage(urlString + '1.png')})
            .wait(100)
            .then(function() {explosion.setImage(urlString + '2.png')})
            .wait(100)
            .then(function() {explosion.setImage(urlString + '3.png')})
            .wait(100)
            .then(function() {opts.pool.releaseView(explosion)});
    };
});
