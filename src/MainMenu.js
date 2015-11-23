import ui.View;
import ui.TextView as TextView;
import ui.ImageScaleView;
import ui.ImageView;
import ui.resource.loader as loader;
import ui.widget.ButtonView as ButtonView;

exports = Class(ui.ImageScaleView, function(supr) {
    
    this.init = function(opts)
    {
        opts = merge(opts, {
            scaleMethod: 'cover',
            x: 0,
            y: 0,
            backgroundColor: '#da197d'    
        });
        
        supr(this, 'init', [opts]);                
        
        this.create();
    };

    this.create = function() {
        var screenWidth = GLOBAL.screenWidth;
        var screenHeight = GLOBAL.screenHeight;
        var view = this;
                
        var text = new TextView({
            superview: this,
            x: (screenWidth / 2) - 200,
            y: (screenHeight / 4),            
            width: 400,
            height: 100,
            text: "Mermaid's Tile",
            size: 80,
            color: "red",
            fontFamily: "Grinched",
            shadowColor: '#111111',
            shadowWidth: 4
        });
        
        // Show buttons
        var startButton = new ButtonView({
            superview: this,
            x: (screenWidth / 2) - 120,
            y: (screenHeight / 2),
            width: 220,
            height: 80,
            images: {
                up: "resources/images/ui/green_button00.png",
                down: "resources/images/ui/green_button01.png"
            },
            text: {
                color: "#FFFFFF",
                size: 30,
                autoFontSize: true,
                autoSize: false,
                fontFamily: "Arista",
                shadowColor: "#111111",
            },
            title: "clearSwapBuffer game",
            on: {
                up: function() {                    
                    view.emit('OpenLevelSelection');
                }
            }
        });
        
    }
});