import ui.View;
import ui.ImageView as ImageView;
import ui.widget.ButtonView as ButtonView;
import ui.ImageScaleView as ImageScaleView;
import animate;

exports = Class(ui.View, function(supr) {
    
    this.init = function(opts)
    {
        var screenWidth = GLOBAL.screenWidth;
        var screenHeight = GLOBAL.screenHeight;        
        
        supr(this, 'init', [opts]);                        
        var view = this;    
        
        this._worldMap = new ImageScaleView({
            superview: this,
            x: 0,
            y: 0,
            width: screenWidth,
            height: screenHeight,
            autoSize: true,
            image: "resources/images/TreasureMap.jpg",
            scaleMethod: 'cover',
            layout: 'box',
            layoutWidth: '100%',
            layoutHeight: '100%',
        });        
            
        // Show buttons
        var exitButton = new ButtonView({
            superview: this,
            x: screenWidth - 90,
            y: 10,
            width: 80,
            height: 80,
            images: {
                up: "resources/images/ui/button_pause.png",
                down: "resources/images/ui/button_pause_pressed.png"
            },
            on: {
                up: function() {
                    view.emit('Back');                    
                }
            }
        });

        this.AddButton("1", 300, 620, {rows: 6, cols: 6, time: 120000, rate: 0.1, objective: 3});
        this.AddButton("2", 150, 510, {rows: 7, cols: 7, time: 180000, rate: 0.1, objective: 4});
        this.AddButton("3", 34, 380, {rows: 7, cols: 7, time: 240000, rate: 0.07, objective: 5});
        this.AddButton("4", 140, 300, {rows: 8, cols: 8, time: 240000, rate: 0.05, objective: 6});
        this.AddButton("5", 80, 180, {rows: 8, cols: 8, time: 300000, rate: 0.03, objective: 7});
    };      
    
    this.AddButton = function(levelName, x, y, opts)
    {
        var view = this;
        var button = new ButtonView({
            superview: this,
            x: x,
            y: y,
            anchorX: 60,
            anchorY: 60,
            width: 120,
            height: 120,
            images: {
                up: "resources/images/ui/button_round_purple.png",
                down: "resources/images/ui/button_round_purplepressed.png"
            },
            text: {
                color: "#FFFFFF",
                size: 34,
                autoFontSize: true,
                autoSize: false,
                shadowColor: "#000000",
            },
            title: levelName,
            on: {
                up: function() {
                    view.emit('OpenIngame', opts);
                }
            }
        });  
        
        return button;
    }
});
