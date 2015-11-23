# Mermaid's Gem

##Descripion
The game is just an usual gem swapping. The objective is to collected certain mermaid by clearing their way to the bottom of the board. The game will be played against the coundown timer, when the timer reach 0, the player loses.
- On level seleciton screen, you can choose one of 5 predefined level. Each one has diferent board size, mermaid spawn rate and playing time.
- The board will be automatically reshuffled when there's no move on board.
- When the player match 4 or more gems, the special gem with matched color will be spawned. This gem will explode all the gems at its row/column, when it's matched again.

##Notes
- Besides provided assets, the level selection's background is collected on internet, I'm not the creator of this image.

 ##Comments
 - SpriteView is very neat and clever, yet it need to be improved somehow such as pingpong animation, customizable rate of each frame
 - It would be great if your framework implement masking feature in future updates. CeatureJS did a very good job of this one.
 - ViewPool is really convinient for I don't need to write my own resource pool. And it's effective as well.
 - The API documentation is somewhat confusing for me to use it properly.
