'use strict';

var MongoClient = require('mongodb').MongoClient;
var ObjectID = require('mongodb').ObjectID;
var assert = require('assert');
var defaultToken = ['raccon', 'fox'];

class DBInterface{
	constructor(u, p, db, host, port){
		this._user = u;
		this._passwd = p;
		this._dbname = db || 'go';
		this._host = host || '127.0.0.1';
		this._port = port || 27017;

		this._db = null;
	}

	// Establish the connection to the database and perform callback() operation
	// after the connection has been established. Use existing connection if possible.
	connect(callback){
		var _this = this;

		// Reuse the database connection to reduce connection creation overhead
		if(_this._db == null){
			var url;
			// If a user name is provided, assume authentication enabled
			if(this._user != null){
				url = 'mongodb://' + this._user + ':' + this._passwd + '@' + this._host + ':' + 
						this._port + '/' + this._dbname + '?authMechanism=DEFAULT&authSource=admin'; 
			}else{
				url = 'mongodb://' + this._host + ':' + this._port + '/' + this._dbname;
			}

			MongoClient.connect(url, function(err, db){
				if(err){
					console.log('DBI> Error connecting to the database');
					_this._db = null;
					callback(err);
				}else{
					console.log('DBI> Connection established');
					_this._db = db;
					callback(null);
				}
			});
		}else{
			callback(null);
		}
	}

	// Callback parameter value:	0: Authentication Failed 1: Authentication Succeed
	// 								2: Account created
	authenticateUser(username, password, callback){
		var _this = this;
		this.connect(function(){
			var collection = _this._db.collection('users');

			collection.findOne({'username' : username}, function(findErr, user){
				if(!user){
					var userObj = {
						'username': username,
						'password': password,
						'tokenId': defaultToken,
						'currentGame': null,
						'gameHistory': []
					};
					collection.insertOne(userObj, function(insertErr, result){
						assert.equal(insertErr, null);
						callback(result.insertedId, 2);
					});
				}else{
					if(user.password == password){
						callback(user._id, 1);
					}else{
						callback(user._id, 0);
					}
				}
			});
		});
	}

	isAccountExist(username, password, callback){
		var _this = this;
		this.connect(function(){
			var collection = _this._db.collection('users');

			collection.findOne({'username' : username}, function(findErr, user){
				if(!user){
					callback(false, null, null);
				}else{
					callback(true, user.password == password, user._id);
				}
			});
		});
	}

	modifyAccountInformation(userAccountObjectID, modificationObject, callback){
		var _this = this;
		this.connect(function(){
			var collection = _this._db.collection('users');
			collection.updateOne({_id : userAccountObjectID}, {$set: modificationObject}, function(err, result){
				callback(err, result);
			});
		});
	}

	mergeAccount(srcID, dstID, callback){
		var _this = this;
		this.connect(function(){
			var collection = _this._db.collection('users');
			collection.find({_id : {$in : [srcID, dstID]}}).toArray(function(findErr, userObjects){
				assert.equal(findErr, null);
				var srcObj, dstObj;
				if(userObjects[0]._id == srcID){
					srcObj = userObjects[0];
					dstObj = userObjects[1];
				}else{
					srcObj = userObjects[1];
					dstObj = userObjects[0];
				}
				// First, remove the temporary account
				collection.removeOne({_id : srcID}, function(removeErr, result) {
					assert.equal(removeErr, null);
					if(srcObj.tokenId[0] == defaultToken[0] && srcObj.tokenId[1] == defaultToken[1]
					 && srcObj.currentGame == null && srcObj.gameHistory.length == 0){
						// The temporary account doesn't contain any new information.
						// Simply switch to the new account
						callback(false);
					}else{
						// Else, append or overwrite the dstination object
						var modificationObject = {
							'tokenId' : srcObj.tokenId,
							'currentGame' : srcObj.currentGame,
							'gameHistory' : dstObj.gameHistory.concat(srcObj.gameHistory)
						};
						_this.modifyAccountInformation(dstID, modificationObject, function(modifyErr, result){
							assert.equal(modifyErr, null);
							callback(true);
						});
					}
				});
			});
		});
	}

	getAccountInfo(userAccountObjectID, callback){
		var _this = this;
		this.connect(function(){
			var collection = _this._db.collection('users');
			collection.findOne({_id : userAccountObjectID}, function(findErr, user){
				if(!user){
					callback(null);
				}else{
					var infoObj = user;
					delete user.password; // Sending password back to client is not a good option
					callback(infoObj);
				}
			});
		});
	}

	newGame(userAccountObjectID, boardSize, gameMode, callback){
		var _this = this;
		this.connect(function(){
			var collection = _this._db.collection('users');
			collection.findOne({_id : userAccountObjectID}, function(findErr, user){
				if(!user){
					callback(null);
				}else{
					var gameHistory = user.gameHistory;
					var gameCollectionObject = {
						"date": Date.now(),
						"gameMode" : 0,
						"player1": "mystigan",
						"player2": "tigger342",
						"boardSize": boardSize,
						"finished": false,
						"currPlayer": 1,
						"capturedTokens1": 0,
						"capturedTokens2": 0,
						"score1": 0,
						"score2": 0,
						"moveHistory": []
					}
					callback(infoObj);
				}
			});
		});
	}

	// Close the connection
	close(){
		if(this._db)
			this._db.close();
	}

	// Initialize the database with basic documents and collections
	init(){
		// Put initializations here if there are any
	}

	// Remove the database "go". Use for debugging purpose only.
	dropDatabase(){
		var _this = this;
		_this.connect(function(){
			db.dropDatabase(function(err, result) {
				if(err != null){
					console.log('Database "go" has been successfully deleted.');
					console.log(result.toString());
				}else{
					console.log('Error occurred when deleting database "go".')
					console.log(result.toString());
				}
			});
		});
	}
}

module.exports = DBInterface;