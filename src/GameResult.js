import ui.View;
import ui.ImageScaleView as ImageScaleView;
import ui.ImageView as ImageView;
import ui.GestureView as GestureView;
import ui.widget.ButtonView as ButtonView;
import ui.TextView as TextView;
import animate;

exports = Class(ImageScaleView, function(supr) {
    
    this.init = function(opts)
    {
        opts = merge(opts, {
            scaleMethod: 'cover',
            x: 0,
            y: 0,
            backgroundColor: '#ffffff'              
        });
        
        supr(this, 'init', [opts]);       
        
        var screenWidth = GLOBAL.screenWidth;
        var screenHeight = GLOBAL.screenHeight;
        var view = this;
        
        var text = new TextView({
            superview: this,
            x: (screenWidth / 2) - 200,
            y: (screenHeight / 4),            
            width: 400,
            height: 100,
            text: "YOU WIN",
            size: 100,
            color: "red",
            fontFamily: "Grinched",
            shadowColor: '#111111',
            shadowWidth: 4
        });
        
        var startButton = new ButtonView({
            superview: this,
            x: screenWidth/2 - 120,
            y: screenHeight/2,
            width: 240,
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
                shadowColor: "#111111",
            },
            title: "Back",
            on: {
                up: function() {                    
                    view.emit('Back');
                }
            }
        });
        
        this.on('SetResult', function(isWinning) {
            text.setText(isWinning
                ? "YOU WIN"
                : "YOU LOSE"
            );
        });
    }
    
});
