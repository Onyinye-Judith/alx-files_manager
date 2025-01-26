import mongoDBCore from 'mongodb/lib/core';

const { MongoClient } = require('mongodb');

/**
 * MongoDB client class.
 * @class DBClient
 * @property {object} db - The MongoDB client.
 * @method {boolean} isAlive - Checks if the MongoDB client is connected to the server.
 * @method {Promise} nbUsers - Returns the number of documents in the collection users.
 * @method {Promise} nbFiles - Returns the number of documents in the collection files.
 */
