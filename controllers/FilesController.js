import { ObjectId } from 'mongodb';
import mime from 'mime-types';
import Queue from 'bull';
import userUtils from '../utils/user';
import fileUtils from '../utils/file';
import basicUtils from '../utils/basic';

const FOLDER_PATH = process.env.FOLDER_PATH || '/tmp/files_manager';

const fileQueue = new Queue('fileQueue');

class FilesController {
	/**
	 *    * Should create a new file in DB and in disk
	 *       *
	 *          * Retrieve the user based on the token:
	 *             * If not found, return an error Unauthorized with a status code 401
	 *                * To create a file, you must specify:
	 *                   * name: as filename
	 *                      * type: either folder, file or image
	 *                         * parentId: (optional) as ID of the parent (default: 0 -> the root)
	 *                            * isPublic: (optional) as boolean to define if the file is public or not
	 *                               * (default: false)
	 *                                  * data: (only for type=file|image) as Base64 of the file content
	 *                                     * If the name is missing, return an error Missing name with a status code 400
	 *                                        * If the type is missing or not part of the list of accepted type, return an
	 *                                           * error Missing type with a status code 400
	 *                                              * If the data is missing and type != folder, return an error Missing data with a
	 *                                                 * status code 400
	 *                                                    * If the parentId is set:
	 *                                                       * If no file is present in DB for this parentId, return an error Parent not found
	 *                                                          * with a status code 400
	 *                                                             * If the file present in DB for this parentId is not of type folder, return an error
	 *                                                                * Parent is not a folder with a status code 400
	 *                                                                   * The user ID should be added to the document saved in DB - as owner of a file
	 *                                                                      * If the type is folder, add the new file document in the DB and return the new file
	 *                                                                         * with a status code 201
	 *                                                                            * Otherwise:
	 *                                                                               * All file will be stored locally in a folder (to create automatically if not present):
	 *                                                                                  * The relative path of this folder is given by the environment variable FOLDER_PATH
	 *                                                                                     * If this variable is not present or empty, use /tmp/files_manager as storing folder path
	 *                                                                                        * Create a local path in the storing folder with filename a UUID
	 *                                                                                           * Store the file in clear (reminder: data contains the Base64 of the file) in this local path
	 *                                                                                              * Add the new file document in the collection files with these attributes:
	 *                                                                                                 * userId: ID of the owner document (owner from the authentication)
	 *                                                                                                    * name: same as the value received
	 *                                                                                                       * type: same as the value received
	 *                                                                                                          * isPublic: same as the value received
	 *                                                                                                             * parentId: same as the value received - if not present: 0
	 *                                                                                                                * localPath: for a type=file|image, the absolute path to the file save in local
	 *                                                                                                                   * Return the new file with a status code 201
	 *                                                                                                                      */
	static async getFile(request, response) {
		    const { userId } = await userUtils.getUserIdAndKey(request);
		    const { id: fileId } = request.params;
		    const size = request.query.size || 0;
		Mongo Condition for Id
		if (!basicUtils.isValidId(fileId)) { return response.status(404).send({ error: 'Not found' }); }
		const file = await fileUtils.getFile({
			_id: ObjectId(fileId),
		});
		if (!file || !fileUtils.isOwnerAndPublic(file, userId)) { return response.status(404).send({ error: 'Not found' }); }
		if (file.type === 'folder') {
			return response
				.status(400)
				.send({ error: "A folder doesn't have content" });
		}
		const { error, code, data } = await fileUtils.getFileData(file, size);
		if (error) return response.status(code).send({ error });
		const mimeType = mime.contentType(file.name);
		response.setHeader('Content-Type', mimeType);
		return response.status(200).send(data);
	}
}
export default FilesController;
