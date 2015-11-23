import device;
import ui.StackView as StackView;
import ui.TextView as TextView;

import src.MainMenu as MainMenu;
import src.LevelSelection as LevelSelection;
import src.InGame as InGame;
import src.GameResult as GameResult;

exports = Class(GC.Application, function () {

  this.initUI = function () {

      var scaleRatio = device.width / 480;      
      var rootView = new StackView({
          superview: this,
          x: 0,
          y: 0,
          width: 480,
          height: device.screen.height / scaleRatio,
          clip: true,
          scale: scaleRatio,
      });

      GLOBAL.screenWidth = rootView.style.width;
      GLOBAL.screenHeight = rootView.style.height;
      GLOBAL.boardSize = 455;
      GLOBAL.tileTypeCount = 5;
      GLOBAL.tileTypeMermaidID = GLOBAL.tileTypeCount * 2 + 1;
      
      var mainMenu = new MainMenu();      
      var levelSelection = new LevelSelection();
      var inGame = new InGame();      
      var gameResult = new GameResult();
      
      rootView.push(mainMenu);
      
      mainMenu.on('OpenLevelSelection', function () {                  
          rootView.push(levelSelection);
      });
      
      levelSelection.on('OpenIngame', function(opts) {
          rootView.push(inGame);
          inGame.emit('StartNewGame', opts);
      });

      levelSelection.on('Back', function(opts) {
          rootView.pop();
      });
      
      inGame.on('Back', function() {
          rootView.pop();
          
          if (!rootView.getCurrentView())
          {
              rootView.push(levelSelection);
          }
      });
      
      inGame.on('EndGame', function(isWinning) {
          rootView.pop({animate: false});
          if (!rootView.getCurrentView())
          {
              rootView.push(levelSelection);
          }
          
          rootView.push(gameResult);
          gameResult.emit('SetResult', isWinning);
      });
      
      gameResult.on('Back', function() {
          rootView.pop();
      });
  };

});
