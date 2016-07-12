var territoryDetector = require('./TerritoryDetector');

// Token colours
const NONE = 0;
const BLACK = 1;
const WHITE = 2;

var http = require('http');

/**
 * Initializes three objects to 2D arrays with 0s
 *
 * @param size {int} board length/width
 * @param board1 {obj}
 * @param board2 {obj}
 * @param board3 {obj}
 */
function init3Boards(size, board1, board2, board3) {
	
}

/**
 * Determines if a move is valid
 *
 * @param prevBoard {2D array} board state last turn
 * @param currBoard {2D array} current board state
 * @param tempBoard {2D array} board state after placing token
 * @param x {int} x coordinate of token
 * @param y {int} y coordinate of token
 * @param colour {int} colour of token
 * @return status code / captured tokens {int}
 *		Error codes are negative
 *		Positive or 0 is number of captured tokens
 *		0+ - number of captured tokens
 *		-1 - position not available
 *		-2 - reverts board state
 *		-3 - suicide
 */
function validateMoveAndCalculateCapturedTokens(prevBoard, currBoard, tempBoard, x, y, colour) {
	/* 
	if position taken in currBoard
		return -1
	
	tempBoard = copy of board
	capturedTokens = makeMove(tempBoard, x, y, colour)
	
	if revertsBoard(tempBoard, prevBoard, x, y, colour)
		return -2
	if suicide(tempBoard, x, y, colour)
		return -3
	
	return capturedTokens
	*/
}

/**
 * Determines if playing a move would result in suicide
 * Note: apply army captures first
 *
 * @param board {2D array}
 * @param x {int} x coordinate of token
 * @param y {int} y coordinate of token
 * @param colour {int} colour of token
 * @return {boolean} true if move would result in suicide 
 */

function suicide(board, x, y, colour) {
	var oppColour = (colour === 1? 2 : 1);

    var dx = [-1, 0, 1, 0];
    var dy = [0, 1, 0, -1];

    for (var direction = 0; direction < 4; direction++) {
        var neighbourX = x + dx[direction];
        var neighbourY = y + dy[direction];
        if (inBounds(board, neighbourX, neighbourY) && board[neighbourY][neighbourX] !== oppColour) {
            return false;
        }
    }

    return true;
	
}

/**
 * @param board {2D array}
 * @param x {int} x coordinate
 * @param y {int} y coordinate
 * @return {Boolean} true if (x,y) is in the board
 */
function inBounds(board, x, y) {
    return (y >= 0 && y < board.length && x >= 0 && x < board.length);
}

/**
 * Determines if playing a move would revert the game board
 * to the previous state
 *
 * @param tempBoard {2D array} board after placing token
 * @param prevBoard {2D array} board last turn
 * @param x {int} x coordinate of token
 * @param y {int} y coordinate of token
 * @param colour {int} colour of token
 * @return {boolean} true if move would revert the game board 
 */
function revertsGameBoard(tempBoard, prevBoard, x, y, colour) {
	// if tempBoard is same as prevBoard, return true
}

/**
 * Places token onto board
 *
 * @param board {2D array}
 * @param x {int} x coordinate of token
 * @param y {int} y coordinate of token
 * @param colour {int} colour of token
 * @return captured tokens {int} 
 */
function makeMove(board, y, x, colour, lastMove, fn) {

    var captureCount = 0;

    if (colour !== 0) {

        var option = {
            host: "roberts.seng.uvic.ca",
            port: "30000",
            path: "/util/findArmies",
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            }
        }

        var callback = function (response) {
            var str = "";

            response.on('data', function (chunk) {
                str += chunk.toString();

            });

            response.on('end', function () {
                //console.log("data: " + str);

                var jsonObj = JSON.parse(str);
                //add code here
                for (i = 0; i < jsonObj.armies.length; i++) {
                    //if that armies has only one liberty AND color is different from armie
                    if (jsonObj.armies[i].liberties.length === 1 && (jsonObj.armies[i].colour != colour)) {
                        // if the only liberty is the place that the token is going to be placed
                        if (jsonObj.armies[i].liberties[0][0] === x && jsonObj.armies[i].liberties[0][1] === y) {
                            //place the token and capture this army
                            board[y][x] = colour;
                            captured = true;
                            for (var j = 0; j < jsonObj.armies[i].size; j++) {
                                var tempx = jsonObj.armies[i].tokens[j].position[0];
                                var tempy = jsonObj.armies[i].tokens[j].position[1];
                                board[tempy][tempx] = 0;
                                captureCount++;

                            }
                        }

                    }
                }
                //console.log("captured: " + captureCount);
                fn(captureCount);
            });


        }

        postData = {
            "board": board,
            "size": board.length,
            "last": lastMove
        };

        var req = http.request(option, callback);

        req.on('error', function (e) {
            console.log("Error: " + e.message);
        });

        req.write(JSON.stringify(postData));



        req.end();


    }



    // place token onto board
    // capture armies if applicable
    // return number of captured tokens (could be 0)
}

/**
 * Converts board from 2D array to list of form
 * [ [x, y, colour], ...]. Tokens of colour NONE
 * are not included
 *
 * @param boardArray {2D array} board in array form
 * @return boardList {array} board in list form
 */
function boardArrayToList(boardArray) {
	var boardList = [];
	for(var i=0;i< boardArray.length;i++){
		for(var j=0; j<boardArray.length; j++){
			if(boardArray[i][j] != 0){
				var temp = [ j, i, boardArray[i][j]];
				boardList.push(temp);
			}
		}
	}
	return boardList;
}

/**
 * Converts board from list to 2D array
 *
 * @param boardList {array of form [ [x, y, colour], ...]}
 * @param boardArray {obj}
 * @return boardArray {array} board in list form
 */
function boardListToArray(boardList, boardArray) {
	for(var i=0;i< boardArray.length;i++){
		for(var j=0; j<boardArray.length; j++){
			boardArray[i][j] = 0;
		}
	}

	for(var k = 0 ; k< boardList.length; k++){
		boardArray[boardList[k][1]][boardList[k][0]] = boardList[k][2];
	}

}

/**
 * Calculates both players' scores
 *
 * @param board {2D array}
 * @param capturedTokens1 {int} player 1's captured tokens(Black)
 * @param capturedTokens1 {int} player 2's captured tokens(White)
 * @return scores { [player1Score player2Score ] }
 */
function calculateScore(board, capturedTokens1, capturedTokens2) {
	// score = army tokens + captured tokens + territory (use countTerritories()) + handicap (for white)
	// handicap scores: 9x9 - 2.5 points, 13x13 - 4.5 points, 19x19 - 7.5 points(Add points for white)
	//score[0] is black, score[1] is white
	var score = [0, 0];
	var token_Num_Black = 0;
	var token_Num_White = 0;
	var handicap = 0;
	var count = countTerritories(board);

	for(var i = 0; i < board.length; i++){
		for(var j = 0; j < board.length; j++){
			if(board[j][i] == 1){
				token_Num_Black++;
			}
			if(board[j][i] == 2){
				token_Num_White++;
			}
		}
	}

	if(board.length == 9){
		handicap = 2.5;
	}
	if(board.length == 13){
		handicap = 4.5;
	}
	if(board.length == 19){
		handicap = 7.5;
	}

	score[0] = token_Num_Black + capturedTokens1 + count[0];
	score[1] = token_Num_White + capturedTokens2 + count[1] + handicap;
	

	return score;
}

/**
 * Counts both players' territory
 *
 * @param board {2D array}
 * @return territory count { [player1Territory player2Territory ] }
 */
function countTerritories(board) {
	var territories = territoryDetector.getTerritories(board);

	var count = [0, 0];

	for (var i = 0; i < territories.length; i++) {
		if (territories[i].owner === BLACK) {
			count[0] += territories[i].size;
		} else if (territories[i].owner === WHITE) {
			count[1] += territories[i].size;
		}
	}
	return count;
}

/**
 * Applies the move after validation
 *
 * @param prevBoard {2D array} board state last turn
 * @param currBoard {2D array} current board state
 * @param tempBoard {2D array} board state after placing token
 * @return board list {array} list form of board state
 */
function applyMove(prevBoard, currBoard, tempBoard) {
	// move currBoard data to prevBoard and
	// tempBoard to currBoard
	// return boardArrayToList(currBoard)
	prevBoard[0] = currBoard[0];
	prevBoard[1] = currBoard[1];
	currBoard[0] = tempBoard[0];
	currBoard[1] = tempBoard[1];
	boardArrayToList(currBoard);
}

module.exports = {
	init3Boards,
	validateMoveAndCalculateCapturedTokens,
	suicide,
	revertsGameBoard,
	makeMove,
	boardArrayToList,
	boardListToArray,
	calculateScore,
	countTerritories,
	applyMove
}