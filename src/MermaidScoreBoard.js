import ui.View;
import ui.ViewPool as ViewPool;
import math.geom.Vec2D as Vec2D;
import ui.ImageScaleView as ImageScaleView;
import src.MermaidScore as MermaidScore;
import ui.TextView as TextView;

exports = Class(ui.View, function(supr) {
    this.init = function(opts)
    {         
        supr(this, 'init', [opts]);  
        
        this.parent = opts.superview;

        var scoreBoard = new ImageScaleView({
            superview: this,
            x: 0,
            y: 0,
            width: 455,
            height: 105,
            image: "resources/images/ui/coinframe.png",
            scaleMethod: "9slice",
            sourceSlices: {
                horizontal: {left: 40, center: 180, right: 40},
                vertical: {top: 24, middle: 64, bottom: 24}
            },
            
            destSlices: {
                horizontal: {left: 20, right: 20},
                vertical: {top: 12, bottom: 12}
            },
        });

        this.scoreText = new TextView({
            superview: this,
            x: 350,
            y: 0,            
            width: 100,
            height: 105,
            text: "",
            size: 42,
            color: "yellow",
            fontFamily: "Grinched",
            shadowColor: '#000000',
            shadowWidth: 4
        });
    };

    this.addPoint = function(opts)
    {
        this.mermaidCount++;
        this.scoreText.setText(this.mermaidCount + "/" + this.mermaidObjective );

        if (this.mermaidCount >= this.mermaidObjective )
        {
            this.parent.Remove();
            this.parent.emit('EndGame', true);
        }
        else
        {
            var pool = this._mermaidPool;
            var explosion = pool.obtainView();
            explosion.onObtain({
                x: opts.x,
                y: opts.y,
                destX: (this.mermaidCount - 1) * 50, 
                destY: -16,
                pool: pool,
            });
        }
    }

    this.reset = function(opts)
    {
        this.mermaidObjective = opts.objective;
        this.mermaidCount = 0;
        this.scoreText.setText(this.mermaidCount + "/" + this.mermaidObjective );
        this._mermaidPool = new ViewPool({
            ctor: MermaidScore,
            initCount: 10,
            initOpts: {
                superview: this,  
                zIndex: 1200,
                type: 1
            }
        });
    }

    this.Remove = function()
    {
        this._mermaidPool.releaseAllViews();
    };
    
});     