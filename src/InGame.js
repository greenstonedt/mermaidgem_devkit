import ui.View;
import animate;

import ui.ImageView as ImageView;
import ui.SpriteView as SpriteView;
import ui.widget.ButtonView as ButtonView;
import ui.TextView as TextView;
import ui.ImageScaleView as ImageScaleView;
import src.Board as Board;
import src.MermaidScoreBoard as MermaidScoreBoard;


exports = Class(ui.View, function(supr) {
    
    this.init = function(opts)
    {
        var screenWidth = GLOBAL.screenWidth;
        var screenHeight = GLOBAL.screenHeight;
        
        supr(this, 'init', [opts]); 
        
        var background = new ImageView({
            superview: this,
            x: 0,
            y: 0,
            width: 480,
            height: 960,
            image: "resources/images/bkgd_table.png"
        });          
        

        
        this.board = new Board({
            superview: this,
            x: 12,
            y: 258,
        });

        this.scoreBoard = new MermaidScoreBoard({
            superview: this,
            x: 12,
            y: 120
        });

        var view = this;
        
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
                    view.Remove();
                    view.emit('Back');                    
                }
            }
        });
        
        var timerBoard = new ImageScaleView({
            superview: this,
            x: 10,
            y: 10,
            width: 130,
            height: 55,
            image: "resources/images/ui/coinframe.png",
            scaleMethod: "9slice",
            sourceSlices: {
                horizontal: {left: 40, center: 120, right: 40},
                vertical: {top: 24, middle: 64, bottom: 24}
            },
            
            destSlices: {
                horizontal: {left: 20, right: 20},
                vertical: {top: 12, bottom: 12}
            },
        });
        
        var clockIcon = new ImageView({
            superview: timerBoard,
            x: 15,
            y: 12,
            width: 30,
            height: 30,
            image: "resources/images/ui/time_icon.png",            
        });
        
        this._labelManaCount = new TextView({
            superview: timerBoard,
            x: 52,
            y: 18,
            width: 80,
            height: 20,
            horizontalAlign: "left",        
            text: "00:00",
            size: 24,
            color: "yellow",
            fontFamily: "Grinched",
            shadowColor: '#000000',
            
        });
        
        this.on('StartNewGame', function(opts) {
            this.newGame(opts);
        });

        this.on('AddMermaid', function(opts) {
            this.scoreBoard.addPoint(opts);
        });
    };    
    
    this.newGame = function(opts)
    {
        this.timer = opts.time;
        this.scoreBoard.reset(opts);
        this.board.newGame(opts);        
    }

    
    this.Remove = function()
    {
        this.board.Remove();        
        this.scoreBoard.Remove(); 
    }


    
    this.tick = function(dt)
    {
        this.timer -= dt;

        if (this.timer <= 0 )
        {
            this.Remove();
            this.emit('EndGame', false);
        }
        else
        {
            var minuteString = Math.floor(this.timer / 60000);
            minuteString = minuteString > 9 ? "" + minuteString : "0" + minuteString;
            var secondString = Math.floor(this.timer / 1000) % 60;
            secondString = secondString > 9 ? "" + secondString : "0" + secondString;
            this._labelManaCount.setText(minuteString + ":" + secondString );
        }
    }
});

