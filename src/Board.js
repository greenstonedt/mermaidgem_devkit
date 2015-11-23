import ui.View;
import ui.ViewPool as ViewPool;
import math.geom.Vec2D as Vec2D;

import src.Tile as Tile; 
import src.ExplosionEffect as ExplosionEffect;

exports = Class(ui.View, function(supr) {
    this.init = function(opts)
    {   
        this.State = {
            Waiting: 0,
            Remove: 1,
            Explode: 2,
            Shuffle: 3,
        };

        opts = merge(opts, {            
            width: GLOBAL.boardSize,
            height: GLOBAL.boardSize,                        
        });        
                
        supr(this, 'init', [opts]);  
        
        this.parent = opts.superview;
        this.playing = false;
                     
        this.tilePool = new ViewPool({
            ctor: Tile,
            initCount: opts.rows * opts.cols,
            initOpts: {
                superview: this,
                width: GLOBAL.tileWidth,
                height: GLOBAL.tileHeight,
                type: 1
            }
        });  

        this.explosionEffectPool = new ViewPool({
            ctor: ExplosionEffect,
            initCount: 100,
            initOpts: {
                superview: this,                
                zIndex: 1000,
                type: 1
            }
        }); 
             
        // Inputs handling                
        this.on('InputStart', function (event, point) {
            var row = Math.floor(point.y / GLOBAL.tileHeight);
            var col = Math.floor(point.x / GLOBAL.tileWidth);
            this.selectedTile = this.getTileAt(row, col);            
            if (this.selectedTile)
            {                
                this.selectedTile.animateSelection();
                this._touchBeginPoint = point;
            }
        });
        
        this.on('InputMove', function (event, point) {
            if (this._touchBeginPoint && this.selectedTile)
            {
                var delta = new Vec2D({
                    x: point.x - this._touchBeginPoint.x,
                    y: point.y - this._touchBeginPoint.y
                });
                
                var mag = delta.getMagnitude();
                if (mag > 25)
                {
                    var fromRow = this.selectedTile.row;
                    var fromCol = this.selectedTile.col;
                    
                    if (Math.abs(delta.y) > Math.abs(delta.x))
                    {
                        var dy = delta.y < 0 ? -1 : 1;
                        var toTile = this.getTileAt(fromRow + dy, fromCol);
                        
                        this.swapFrom = this.selectedTile;
                        this.swapTo = toTile;                        
                    }
                    else                        
                    {
                        var dx = delta.x < 0 ? -1 : 1;
                        var toTile = this.getTileAt(fromRow, fromCol + dx);
                        
                        this.swapFrom = this.selectedTile;
                        this.swapTo = toTile;
                    }                    
                }
            }
        });
        
        this.on('InputOut', function (event, point) {
            this.unselectCurrentTile();
        });
    };     
    
    this.newGame = function(opts)
    {
        GLOBAL.tileWidth =  GLOBAL.boardSize / opts.rows;
        GLOBAL.tileHeight = GLOBAL.boardSize / opts.cols;        
        
        this.rows = opts.rows;
        this.cols = opts.cols;
        this.mermaidSpawnRate = opts.rate;

        this.tiles = new Array(this.rows);                
        for (var row = 0; row < this.rows; ++row)
        {
            this.tiles[row] = new Array(this.cols);
            for (var col = 0; col < this.cols; ++col)
            {
                this.fallTileTo(row, col);
            }
        }    
        
        this.resetReshuffleChecks();
        
        this.selectedTile = null;
        this._touchBeginPoint = null;
        this.playing = true;
        
        this.swapTolerationTime = 500;
        this.swapFrom = null;
        this.swapTo = null;
        
        this._checkForMatchesTargets = null;
        this.state = this.State.Explode;        
    }
    
    this.Remove = function()
    {
        this.playing = false;
        this.tilePool.releaseAllViews();
    };
    
    this.unselectCurrentTile = function() {
        if (this.selectedTile)
        {
            this.selectedTile.animateUnselection();
        }
        this.selectedTile = null;
        this._touchBeginPoint = null;
    };
    
    this.swapTiles = function(fromTile, toTile)
    {
        if (fromTile == null || toTile == null || fromTile == toTile)
        {
            return false;
        }
        
        var drow = Math.abs(fromTile.row - toTile.row);
        var dcol = Math.abs(fromTile.col - toTile.col);
        if ((drow == 1 && dcol == 0) || (drow == 0 && dcol == 1))
        {    
            this.unselectCurrentTile();
            
            if (!this.checkSwap(fromTile, toTile) && !this.checkSwap(toTile, fromTile))
            {
                fromTile.SwapBack(toTile);
                toTile.SwapBack(fromTile);
                
                this.swapTolerationTime = 300;
            }
            else
            {                  
                var fromRow = fromTile.row;
                var fromCol = fromTile.col;
                var toRow = toTile.row;
                var toCol = toTile.col;
                this.tiles[fromRow][fromCol] = toTile;
                this.tiles[toRow][toCol] = fromTile;                
                fromTile.Swap(toTile);   
                
                this.swapTolerationTime = 200;
                
                return true;
            }                    
        }
        
        return false;
    };
    
    this.checkTrio = function(tile1, tile2, tile3)
    {
        return tile1 != null && tile2 != null && tile3 != null && tile1.isMatched(tile2) && tile2.isMatched(tile3) && tile3.isMatched(tile1);
    }
    
    this.checkSwap = function(fromTile, toTile)
    {
        var row = toTile.row;
        var col = toTile.col;
        var res = false;
        
        // Vertical check
        for (var i = 0; i <= 2; ++i)
        {
            var tile1 = this.getTileAt(row - 2 + i, col);
            var tile2 = this.getTileAt(row - 1 + i, col);
            var tile3 = this.getTileAt(row + i, col);
                      
            if (this.checkTrio(tile1 == fromTile ? toTile : (tile1 == toTile) ? fromTile : tile1,
                 tile2 == fromTile ? toTile : (tile2 == toTile) ? fromTile : tile2,  
                 tile3 == fromTile ? toTile : (tile3 == toTile) ? fromTile : tile3))
            {
                res = true;
                break;
            }
        }
        
        if (!res)
        {
            // Horizontal check
            for (var i = 0; i <= 2; ++i)
            {
                var tile1 = this.getTileAt(row, col - 2 + i);
                var tile2 = this.getTileAt(row, col - 1 + i);
                var tile3 = this.getTileAt(row, col + i);

                if (this.checkTrio(tile1 == fromTile ? toTile : (tile1 == toTile) ? fromTile : tile1,
                    tile2 == fromTile ? toTile : (tile2 == toTile) ? fromTile : tile2,  
                    tile3 == fromTile ? toTile : (tile3 == toTile) ? fromTile : tile3))
                {
                    res = true;
                    break;
                }
            }
        }
        
        return res;
    }
    
    this.resetReshuffleChecks = function()
    {
        this._potCheckIndex = 0;        
        this._potCheckMatches = [];
        this._isPotCheckDone = false;
    }
    
    this.updateReshuffleChecks = function()
    {
        if (!this._isPotCheckDone)
        {
            var row = Math.floor(this._potCheckIndex / this.rows);
            var col = Math.floor(this._potCheckIndex % this.cols);

            this.checkReshuffleMatches(row, col, this._potCheckMatches);

            // Next check
            var maxChecks = this.rows * this.cols;        
            ++this._potCheckIndex;
            if (this._potCheckIndex >= maxChecks)
            {
                this._isPotCheckDone = true;
            }
        }
    }
    
    this.checkReshuffleMatches = function(row, col, matchesResult)
    {
        var matches1 = this.checkHorizontalReshuffle1(row, col);
        var matches2 = this.checkHorizontalReshuffle2(row, col);
        var matches3 = this.checkHorizontalReshuffle3(row, col);
        var matches4 = this.checkVerticalReshuffle1(row, col);
        var matches5 = this.checkVerticalReshuffle2(row, col);
        var matches6 = this.checkVerticalReshuffle3(row, col);
        
        if (matches1) {
            matchesResult.push(matches1);
        }
        
        if (matches2) {
            matchesResult.push(matches2);
        }
        
        if (matches3) {
            matchesResult.push(matches3);
        }
        
        if (matches4) {
            matchesResult.push(matches4);
        }
        
        if (matches5) {
            matchesResult.push(matches5);
        }
        
        if (matches6) {
            matchesResult.push(matches6);
        }
    }
    
    this.checkHorizontalReshuffle1 = function(row, col)
    {
        if (col <= this.cols - 2)
        {
            var tile1 = this.tiles[row][col];
            var tile2 = this.tiles[row][col + 1];            
            
            if (row >= 1 && col >= 1)
            {
                var tile3 = this.tiles[row - 1][col - 1];
                if (this.checkTrio(tile1, tile2, tile3))
                {
                    return [tile3, this.tiles[row][col - 1]];
                }
            }
            
            if (row <= this.rows - 2 && col >= 1)
            {
                var tile3 = this.tiles[row + 1][col - 1];
                if (this.checkTrio(tile1, tile2, tile3))
                {
                    return [tile3, this.tiles[row][col - 1]];
                }
            }
        }
        
        return null;
    }
    
    this.checkHorizontalReshuffle2 = function(row, col)
    {
        if (col <= this.cols - 3)
        {
            var tile1 = this.tiles[row][col];
            var tile2 = this.getTileAt(row, col + 1);            
            
            if (row >= 1 && col <= this.cols - 3)
            {
                var tile3 = this.tiles[row - 1][col + 2];
                if (this.checkTrio(tile1, tile2, tile3))
                {
                    return [tile3, this.tiles[row][col + 2]];
                }
            }
            
            if (row <= this.rows - 2 && col <= this.cols - 3)
            {
                var tile3 = this.tiles[row + 1][col + 2];
                if (this.checkTrio(tile1, tile2, tile3))
                {
                    return [tile3, this.tiles[row][col + 2]];
                }
            }
        }
        
        return null;
    }
    
    this.checkHorizontalReshuffle3 = function(row, col)
    {
        var tile1 = this.tiles[row][col];        
        if (col <= this.cols - 2)
        {
            var tile2 = this.tiles[row][col + 1];            
            if (col <= this.cols - 4)
            {                
                var tile3 = this.tiles[row][col + 3];
                if (this.checkTrio(tile1, tile2, tile3))
                {
                    return [tile3, this.tiles[row][col + 2]];
                }
            }

            if (col >= 2)
            {                
                var tile3 = this.tiles[row][col - 2];
                if (this.checkTrio(tile1, tile2, tile3))
                {
                    return [tile3, this.tiles[row][col - 1]];
                }
            }
        }
        return null;
    }
    
    this.checkVerticalReshuffle1 = function(row, col)
    {
        if (row <= this.rows - 2)
        {
            var tile1 = this.tiles[row][col];
            var tile2 = this.tiles[row + 1][col];
            
            if (col >= 1 && row >= 1)
            {
                var tile3 = this.tiles[row - 1][col - 1];
                if (this.checkTrio(tile1, tile2, tile3))
                {
                    return [tile3, this.tiles[row - 1][col]];
                }
            }
            
            if (col <= this.cols - 2 && row >= 1)
            {
                var tile3 = this.tiles[row - 1][col + 1];
                if (this.checkTrio(tile1, tile2, tile3))
                {
                    return [tile3, this.tiles[row - 1][col]];
                }
            }
        }
        
        return null;
    }
    
    this.checkVerticalReshuffle2 = function(row, col)
    {
        if (row <= this.rows - 3)
        {
            var tile1 = this.tiles[row][col];
            var tile2 = this.tiles[row + 1][col];
            
            if (col >= 1)
            {
                var tile3 = this.tiles[row + 2][col - 1];
                if (this.checkTrio(tile1, tile2, tile3))
                {
                    return [tile3, this.tiles[row + 2][col]];
                }
            }
            
            if (col <= this.cols - 2)
            {
                var tile3 = this.tiles[row + 2][col + 1];
                if (this.checkTrio(tile1, tile2, tile3))
                {
                    return [tile3, this.tiles[row + 2][col]];
                }
            }
        }
        
        return null;
    }
    
    this.checkVerticalReshuffle3 = function(row, col)
    {
        var tile1 = this.tiles[row][col];
        if (row <= this.rows - 2)
        {
            var tile2 = this.tiles[row + 1][col];
            if (row <= this.rows - 4)
            {                        
                var tile3 = this.tiles[row + 3][col];
                if (this.checkTrio(tile1, tile2, tile3))
                {
                    return [tile3, this.tiles[row + 2][col]];
                }
            }

            if (row >= 2)
            {
                var tile3 = this.tiles[row - 2][col];
                if (this.checkTrio(tile1, tile2, tile3))
                {
                    return [tile3, this.tiles[row - 1][col]];
                }
            }
        }
        
        return null;
    }
        
    this.getTileAt = function(row, col)
    {
        if (row >= 0 && row < this.rows)
        {
            if (col >= 0 && col < this.cols)
            {
                return this.tiles[row][col];
            }
        }
        return null;
    };

    this.tick = function(dt)
    {
        if (!this.playing)
        {
            return;
        }
        
        if (this.swapTolerationTime > 0)
        {
            this.swapTolerationTime -= dt;
        }
        else
        {                    
            if (this.state == this.State.Remove)
            {
                this.updateRemoveTiles();
            }
            else if (this.state == this.State.Explode)
            {                
                this.updateExplodeTiles();   
            }
            else if (this.state == this.State.Shuffle)
            {
                this.updateShuffleTiles();
                return;
            }
            
            var swapFromTile = this.swapFrom;
            var swapToTile = this.swapTo;
            this.swapFrom = null;
            this.swapTo = null;                

            if (swapFromTile && swapToTile)
            {
                if (this.swapTiles(swapFromTile, swapToTile))
                {
                    this._checkForMatchesTargets = [swapFromTile, swapToTile];                                
                    if (this.state == this.State.Waiting)
                    {
                        this.state = this.State.Explode;
                    }
                }
            }
        }     
        
        if (this.state == this.State.Waiting)
        {            
            for (var i = 0; i < this.cols * 4; ++i)
            {
                this.updateReshuffleChecks();
            }

            if (this._isPotCheckDone && this._potCheckMatches.length == 0)
            {
                this.resetReshuffleChecks();
                this.state = this.State.Shuffle;

                this.swapFrom = null;
                this.swapTo = null; 
            }
        }
    }
    
    this.removeTile = function(tile, isReshuffling)
    {
        if (typeof isReshuffling == 'undefined') isReshuffling = false;
        if (tile)
        {
            var tilePositon = tile.getPosition();
            if (tile.type == GLOBAL.tileTypeMermaidID && !isReshuffling)
            {
                this.parent.emit('AddMermaid', {x: tile.getPosition().x, y: tile.getPosition().y});
            }
            else
                this.ExplosionEffect(tile.type, tilePositon.x, tilePositon.y);
            
            this.tiles[tile.row][tile.col] = null;
            this.tilePool.releaseView(tile);                                
        }
    }
    
    this.fillTileAt = function(row, col, type)
    {
        if (this.tiles[row][col] == null)
        {
            var tile = this.tilePool.obtainView();
            tile.onObtain({
                row: row,
                col: col,
                type: type,
                isFalling: false,
            });            

            this.tiles[row][col] = tile;
            
            return 1;
        }
        
        return 0;
    }
    
    this.fallTileTo = function(row, col)
    {
        if (this.tiles[row][col] == null)
        {
            var isRndMermaid = Math.random() < this.mermaidSpawnRate;
            var rndType = isRndMermaid ? GLOBAL.tileTypeMermaidID : (Math.floor(Math.random() * GLOBAL.tileTypeCount) + 1);
            var tile = this.tilePool.obtainView();
            tile.onObtain({
                row: row,
                col: col,
                type: rndType,
                isFalling: true,
            });            

            this.tiles[row][col] = tile;
            
            return 1;
        }
        
        return 0;
    }
    

    this.ExplosionEffect = function(type, x, y)
    {
        if (type == GLOBAL.tileTypeMermaidID) return;
        var pool = this.explosionEffectPool;
        
        var explosion = this.explosionEffectPool.obtainView();
        explosion.onObtain({
            type: type,
            x: x,
            y: y,            
            width: GLOBAL.tileWidth,
            height: GLOBAL.tileHeight,
            pool: pool,
        });
    }
    
    this.updateShuffleTiles = function()
    {
        for (var row = 0; row < this.rows; ++row)
        {
            for (var col = 0; col < this.cols; ++col)
            {
                var tile = this.tiles[row][col];          
                
                this.removeTile(tile, true);               
                this.clearSwapBuffer(tile);
                this.fallTileTo(row, col);
            }
        }
        
        this.state = this.State.Explode;
        this.swapTolerationTime = 1000;
        this.swapFrom = null;
        this.swapTo = null;     
    }
    
    this.updateRemoveTiles = function()
    {
        var checkCount = 0;
        for (var row = this.rows - 1; row >= 0; --row)
        {
            for (var col = 0; col < this.cols; ++col)
            {
                var tile = this.tiles[row][col];
                checkCount += this.collapseTile(tile);
            }
        }

        for (var row = 0; row < this.rows; ++row)
        {
            for (var col = 0; col < this.cols; ++col)
            {
                checkCount += this.fallTileTo(row, col);
            }
        }

        if (checkCount > 0 || this._checkForMatchesTargets)
        {                       
            this._checkForMatchesTargets = null;
            this.state = this.State.Explode;     

            this.swapTolerationTime = 300;      

            this.resetReshuffleChecks();      
        }                
        else
        {
            this.state = this.State.Waiting;     
        }
    }
    
    this.updateExplodeTiles = function()
    {
        var checkCount = 0;

        if (this._checkForMatchesTargets)
        {
            var view = this;
            this._checkForMatchesTargets.forEach(function(element, index, array) {
                var count = view.explodeMatches(element); 
                
                if (count >= 4 && element.type <= GLOBAL.tileTypeCount)
                {
                    view.fillTileAt(element.row, element.col, element.type + GLOBAL.tileTypeCount);
                }
                
                checkCount += count;
            });

            this._checkForMatchesTargets = null;
        }

        for (var row = 0; row < this.rows; ++row)
        {
            for (var col = 0; col < this.cols; ++col)
            {
                var tile = this.tiles[row][col];
                checkCount += this.explodeMatches(tile);                        
            }
        }                

        if (checkCount > 0)
        {
            this.resetReshuffleChecks();
            this.state = this.State.Remove;
        }
        else
        {                    
            this.state = this.State.Waiting;                         
        }

        this.swapTolerationTime = 100;
    }
    
    this.collapseTile = function(tile)
    {
        if (tile)
        {
            var row = tile.row;
            var col = tile.col;
            
            var fallToRow = null;
            for (var i = row + 1; i < this.rows; ++i)
            {
                var g = this.tiles[i][col];
                if (!g)
                {
                    fallToRow = i;
                }
                else
                {
                    break;
                }
            }
            
            if (fallToRow)
            {
                tile.row = fallToRow;
                tile.Drop();
                
                this.tiles[row][col] = null;
                this.tiles[fallToRow][col] = tile;
                
                this.clearSwapBuffer(tile);
                return 1;
            }
        }
        
        return 0;
    }
    
    this.clearSwapBuffer = function(tile)
    {
        if (this.swapFrom == tile)
        {
            this.swapFrom = null;
        }
        else if (this.swapTo == tile)
        {
            this.swapTo = null;
        }
    }
    
    this.explodeMatches = function(fromTile)
    {
        if (fromTile)
        {
            if (fromTile.type == GLOBAL.tileTypeMermaidID)
            {
                return this.mermaidMove(fromTile);
            }
            else if (fromTile.type > GLOBAL.tileTypeCount)
            {
                return this.carpetExplode(fromTile);
            }
            else
            {
                return this.explodeMatchesNormal(fromTile);
            }
        }
        
        return 0;
    }

    this.mermaidMove = function(fromTile)
    {
        if (fromTile.row ==  this.rows - 1)
        {     
            var view = this;
            this.removeTile(fromTile);
            view.clearSwapBuffer(fromTile);
            return 1;
        }
        return 0;
    }

    this.carpetInnerVerticalCheck = function(checkedTile)
    {
        var carpetInnerVerticalMatched = [];
        if (checkedTile.type > GLOBAL.tileTypeCount && checkedTile.type != GLOBAL.tileTypeMermaidID)
        {
            for (var ii = checkedTile.col + 1; ii < this.cols; ++ii)
            {
                var innertile = this.tiles[checkedTile.row][ii];
                if (innertile && innertile.type != GLOBAL.tileTypeMermaidID) carpetInnerVerticalMatched.push(innertile);
            }
            for (var ii = checkedTile.col - 1; ii >= 0; --ii)
            {
                var innertile = this.tiles[checkedTile.row][ii];
                if (innertile && innertile.type != GLOBAL.tileTypeMermaidID) carpetInnerVerticalMatched.push(innertile);
            }
        } 

        return carpetInnerVerticalMatched;
    }

    this.carpetInnerHorizonalCheck = function(checkedTile)
    {
        var carpetInnerHorizonalMatched = [];
        if (checkedTile.type > GLOBAL.tileTypeCount && checkedTile.type != GLOBAL.tileTypeMermaidID)
        {
            for (var ii = checkedTile.row + 1; ii < this.rows; ++ii)
            {
                var innertile = this.tiles[ii][checkedTile.col];
                if (innertile && innertile.type != GLOBAL.tileTypeMermaidID) carpetInnerHorizonalMatched.push(innertile);
            }
            for (var ii = checkedTile.row - 1; ii >= 0; --ii)
            {
                var innertile = this.tiles[ii][checkedTile.col];
                if (innertile && innertile.type != GLOBAL.tileTypeMermaidID) carpetInnerHorizonalMatched.push(innertile);
            }
        } 

        return carpetInnerHorizonalMatched;
    }
    
    this.carpetExplode = function(fromTile)
    {
        var exploded = false;
        var willExplode = false;
        var row = fromTile.row;
        var col = fromTile.col;
        var carpetMatches = [];
        var carpetInnerVerticalMatched = [];
        var carpetInnerHorizonalMatched = [];
        var matchStopped = false;

        var verticalMatches = [];

        matchStopped = false;
        for (var i = row + 1; i < this.rows; ++i)
        {
            var tile = this.tiles[i][col];
            if (tile) carpetMatches.push(tile);
            if (tile && fromTile.isMatched(tile) && !matchStopped)
            {
                carpetInnerVerticalMatched = carpetInnerVerticalMatched.concat(this.carpetInnerVerticalCheck(tile));    
                verticalMatches.push(tile);                
            }
            else
            {
                matchStopped = true;
            }
        }
        matchStopped = false;
        for (var i = row - 1; i >= 0; --i)
        {
            var tile = this.tiles[i][col];
            if (tile) carpetMatches.push(tile);
            if (tile && fromTile.isMatched(tile) && !matchStopped)
            {   
                carpetInnerVerticalMatched = carpetInnerVerticalMatched.concat(this.carpetInnerVerticalCheck(tile));     
                verticalMatches.push(tile);         
            }
            else
            {
                matchStopped = true;
            }
        }    

        if (verticalMatches.length >= 2)
        {
            willExplode = true;
        }

        var horizontalMatches = [];

        matchStopped = false;
        for (var i = col + 1; i < this.cols; ++i)
        {
            var tile = this.tiles[row][i];
            if (tile) carpetMatches.push(tile);
            if (tile && fromTile.isMatched(tile) && !matchStopped)
            {
                carpetInnerHorizonalMatched = carpetInnerVerticalMatched.concat(this.carpetInnerHorizonalCheck(tile));     
                horizontalMatches.push(tile);
            }
            else
            {
                matchStopped = true;
            }
        }
        matchStopped = false;
        for (var i = col - 1; i >= 0; --i)
        {
            var tile = this.tiles[row][i];
            if (tile) carpetMatches.push(tile);
            if (tile && fromTile.isMatched(tile) && !matchStopped)
            {  
                carpetInnerHorizonalMatched = carpetInnerVerticalMatched.concat(this.carpetInnerHorizonalCheck(tile));   
                horizontalMatches.push(tile);
            }
            else
            {
                matchStopped = true; 
            }
        }        
        if (horizontalMatches.length >= 2 || verticalMatches.length >= 2)
        {
            willExplode = true;
        }

        if (willExplode)
        {
            var view = this;
            carpetMatches.forEach(function(element, index, array) {
                view.removeTile(element);
                view.clearSwapBuffer(element);
            });

            if (verticalMatches.length >= 2 )
            {
                carpetInnerVerticalMatched.forEach(function(element, index, array) {
                    view.removeTile(element);
                    view.clearSwapBuffer(element);
                });
            }

            if (horizontalMatches.length >= 2 )
            {
                carpetInnerHorizonalMatched.forEach(function(element, index, array) {
                    view.removeTile(element);
                    view.clearSwapBuffer(element);
                });
            }
            exploded = true;
        }

        if (exploded)
        {
            var count = 1 + carpetMatches.length;       
            
            this.removeTile(fromTile);
            view.clearSwapBuffer(fromTile);
            return count;
        }   
        return 0;
    }
    
    this.explodeMatchesNormal = function(fromTile)
    {
        var exploded = false;
        var row = fromTile.row;
        var col = fromTile.col;
        carpetInnerHorizonalMatched = [];
        carpetInnerVerticalMatched = [];
        haveVeritcalCarpet = false;
        haveHorizonalCarpet = false;

        // Vertical check
        var verticalMatches = [];

        var matchStopped = false;
        for (var i = row + 1; i < this.rows; ++i)
        {
            var tile = this.tiles[i][col];
            if (tile) carpetInnerVerticalMatched.push(tile);
            if (tile && fromTile.isMatched(tile) && !matchStopped)
            {
                if (tile.type > GLOBAL.tileTypeCount)
                {
                    haveVeritcalCarpet = true;
                }     
                carpetInnerVerticalMatched = carpetInnerVerticalMatched.concat(this.carpetInnerVerticalCheck(tile)); 
                verticalMatches.push(tile);                

            }
            else
            {
                matchStopped = true;
                //break;
            }
        }
        matchStopped = false;
        for (var i = row - 1; i >= 0; --i)
        {
            var tile = this.tiles[i][col];
            if (tile) carpetInnerVerticalMatched.push(tile);
            if (tile && fromTile.isMatched(tile) && !matchStopped)
            {
                if (tile.type > GLOBAL.tileTypeCount)
                {
                    haveVeritcalCarpet = true;
                }     
                carpetInnerVerticalMatched = carpetInnerVerticalMatched.concat(this.carpetInnerVerticalCheck(tile));       
                verticalMatches.push(tile);                
            }
            else
            {
                matchStopped = true;
                //break;
            }
        }        
        if (verticalMatches.length >= 2)
        {
            var view = this;
            verticalMatches.forEach(function(element, index, array) {
                view.removeTile(element);
                view.clearSwapBuffer(element);
            });

            if (haveVeritcalCarpet)
            {           
                carpetInnerVerticalMatched.forEach(function(element, index, array) {
                    view.removeTile(element);
                    view.clearSwapBuffer(element);
                });
            }
            exploded = true;
        }

        // Horizontal check
        var horizontalMatches = [];

        matchStopped = false;
        for (var i = col + 1; i < this.cols; ++i)
        {
            var tile = this.tiles[row][i];
            if (tile) carpetInnerHorizonalMatched.push(tile);
            if (tile && fromTile.isMatched(tile) && !matchStopped)
            {
                if (tile.type > GLOBAL.tileTypeCount)
                {
                    haveHorizonalCarpet = true;
                } 
                carpetInnerHorizonalMatched = carpetInnerVerticalMatched.concat(this.carpetInnerHorizonalCheck(tile));   
                horizontalMatches.push(tile);
            }
            else
            {
                matchStopped = true;   
                //break;                
            }
        }

        matchStopped = false;
        for (var i = col - 1; i >= 0; --i)
        {
            var tile = this.tiles[row][i];
            if (tile) carpetInnerHorizonalMatched.push(tile);
            if (tile && fromTile.isMatched(tile) && !matchStopped)
            {
                if (tile.type > GLOBAL.tileTypeCount)
                {
                    haveHorizonalCarpet = true;
                } 
                carpetInnerHorizonalMatched = carpetInnerVerticalMatched.concat(this.carpetInnerHorizonalCheck(tile));   
                horizontalMatches.push(tile);
            }
            else
            {
                matchStopped = true;   
                //break;                
            }
        }        
        if (horizontalMatches.length >= 2)
        {
            var view = this;
            horizontalMatches.forEach(function(element, index, array) {
                view.removeTile(element);
                view.clearSwapBuffer(element);
            });

            if(haveHorizonalCarpet)
            {
                carpetInnerHorizonalMatched.forEach(function(element, index, array) {
                    view.removeTile(element);
                    view.clearSwapBuffer(element);
                });
            }
            exploded = true;
        }

        if (exploded)
        {
            var count = 1 + verticalMatches.length + horizontalMatches.length; 
            
            this.removeTile(fromTile);
            view.clearSwapBuffer(fromTile);
                        
            return count;
        }
        
        return 0;
    }
});
