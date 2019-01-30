(function (angular, _) {
    'use strict';

    /**
     * Module oinio.core.service:FileService
     */
    angular.module('oinio.core')
        .service('FileService', function ($q, $filter, $cordovaFile, $log, APP_SETTINGS, UtilService, LocalCacheService, LOG_SETTING, $cordovaEmailComposer, Logger, $injector, $timeout) {
            var service = this;

            var Exception = $injector.get('Exception');
            var EXCEPTION_SEVERITY = $injector.get('EXCEPTION_SEVERITY');
            var PROCESS_CODE = $injector.get('PROCESS_CODE');
            var STATUS_CODE = $injector.get('STATUS_CODE');

            var dataFileRootDirectory = null;
            var attachmentFolderName = 'Attachment';
            var attachmentFolderIsChecked = false;
            var fileFolderName = 'File';
            var fileFolderIsChecked = false;
            var logFolderName = 'Log';
            var logFolderIsChecked = false;
            var logFileNamePrefix = 'logfile-';
            var logFileNameTimeFormat = 'yyyy-MM-dd-HH-mm-ss';
            var logFileNameSuffix = '.log';
            var currentWritingLogFileName = null;
            var tmpLogDataQueue = [];
            var writingLogTimerRunning = false;
            var logFileSize = LOG_SETTING.LOG_FILE_SIZE ? (LOG_SETTING.LOG_FILE_SIZE * 1024) : (5 * 1024 * 1024); // bytes, default 5M
            var logFileWritingBatchSize = LOG_SETTING.LOG_FILE_WRITING_BATCH_SIZE ? (LOG_SETTING.LOG_FILE_WRITING_BATCH_SIZE * 1024) : (10 * 1024); // bytes, default 10kb

            // In a writing log data interval time, if the queue still remains more than the min size,
            // continue to write at that moment, otherwise wait for next interval time.
            var logFileSecondWritingMinSize = 10;

            /**
             * @ngdoc method
             * @name initializeUserFolders
             * @methodOf oinio.core.service:FileService
             * @description
             * Checks whether all necessary folders is already created, if not, create them.
             * @returns {*}
             */
            service.initializeUserFolders = function () {
                var deferred = $q.defer();

                // Check the attachment folder is exist, if not create it.
                checkAttachmentFolder().then(function () {

                    // Check the file folder is exist, if not create it.
                    checkFileFolder().then(function () {

                        // Initialize log folder:
                        // when logging feature is enabled, check the log folder is exist, if not create it;
                        // when logging feature is disabled, remove the log folder.
                        service.initializeLogFolder().then(function () {

                            deferred.resolve(true);
                        }, function (error) {
                            deferred.reject('check and create Log folder failed error:' + error);
                        });
                    }, function (error) {
                        deferred.reject('check and create File folder failed error:' + error);
                    });
                }, function (error) {
                    deferred.reject('check and create Attachment folder failed error:' + error);
                });

                return deferred.promise;
            };

            /**
             * @ngdoc method
             * @name saveAttachmentBody
             * @methodOf oinio.core.service:FileService
             * @description
             * Save attachment boy into soup or file according to the encrypted setting of its related object
             *
             * @param {object} attachment - attachment soup object
             * @param {object} relatedObjectType - attachment related object type information including encrypted configuration
             * @param {object|string} body - attachment body for saving (data type is ArrayBuffer or Base64)
             *
             * @returns {promise}
             */
            service.saveAttachmentBody = function (attachment, relatedObjectType, body) {
                var deferred = $q.defer();

                var saveAttachmentBody = function () {

                    // body is arrayBuffer(typeof is object) or base64 string(typeof is string)
                    // if body is ArrayBuffer
                    if (typeof body === 'object') {

                        // check encrypted of this attachment related object configuration is true
                        // if true store in soup, otherwise store in local file system
                        if (relatedObjectType && relatedObjectType['MobileVizArt__Attachments_Encrypted__c']) {

                            var attachmentBody = {
                                AttachmentSid: attachment._soupEntryId,
                                Body: arrayBuffer2Base64(body) // convert arrayBuffer to base64 string
                            };

                            // store body data into smartStore
                            navigator.smartstore.upsertSoupEntriesWithExternalId('AttachmentBody', [attachmentBody], 'AttachmentSid', function () {
                                deferred.resolve(true);
                            }, function (err) {
                                deferred.reject('FileService.saveAttachmentBody into soup error: ' + JSON.stringify(err));
                            });

                        } else {

                            // check attachment folder is exist, if not exist, create it
                            checkAttachmentFolder().then(function () {

                                // remove attachment of previous version
                                service.removeAttachmentBySids([attachment._soupEntryId]).then(function () {

                                    // check _soupEntryId folder is exist, if not exist, create it
                                    checkAndCreateDir(getAttachmentFolder(), attachment._soupEntryId + '').then(function () {

                                        // store body data into file system
                                        $cordovaFile.writeFile(getAttachmentFolder() + '/' + attachment._soupEntryId, attachment.Name,
                                            body, true).then(function (success) {

                                                // success
                                                deferred.resolve(true);
                                            }, function (error) {
                                                // error
                                                deferred.reject('FileService.saveAttachmentBody into file system error: ' + JSON.stringify(error));
                                            });
                                    }, function (error) {

                                        // error
                                        deferred.reject('FileService.saveAttachmentBody check _soupEntryId folder error: ' + JSON.stringify(error));
                                    });
                                }, function (error) {

                                    // error
                                    deferred.reject('FileService.saveAttachmentBody removeAttachmentBySids error: ' + JSON.stringify(error));
                                });
                            }, function (error) {
                                // error
                                deferred.reject('FileService.saveAttachmentBody checkAttachmentFolder error: ' + JSON.stringify(error));
                            });
                        }

                    } else if (typeof body === 'string') {

                        if (body.indexOf(';base64,') !== -1) {
                            body = body.substr(body.indexOf(';base64,') + 8, body.length);
                        }

                        // check encrypted of this attachment related object configuration is true
                        // if true store in soup, otherwise store in local file system
                        if (relatedObjectType && relatedObjectType['MobileVizArt__Attachments_Encrypted__c']) {

                            var attachmentBody = {
                                AttachmentSid: attachment._soupEntryId,
                                Body: body
                            };

                            // store body data into smartStore
                            navigator.smartstore.upsertSoupEntriesWithExternalId('AttachmentBody', [attachmentBody], 'AttachmentSid', function () {
                                deferred.resolve(true);
                            }, function (err) {
                                deferred.reject('FileService.saveAttachmentBody into soup error: ' + JSON.stringify(err));
                            });
                        } else {

                            // check attachment folder is exist, if not exist, create it
                            checkAttachmentFolder().then(function () {

                                // remove attachment of previous version
                                service.removeAttachmentBySids([attachment._soupEntryId]).then(function () {

                                    // check _soupEntryId folder is exist, if not exist, create it
                                    checkAndCreateDir(getAttachmentFolder(), attachment._soupEntryId + '').then(function () {

                                        // store body data into file system
                                        $cordovaFile.writeFile(getAttachmentFolder() + '/' + attachment._soupEntryId, attachment.Name,
                                            base64toBlob(body), true).then(function (success) {

                                                // success
                                                deferred.resolve(true);
                                            }, function (error) {
                                                // error
                                                deferred.reject('FileService.saveAttachmentBody into file system error: ' + JSON.stringify(error));
                                            });
                                    }, function (error) {

                                        // error
                                        deferred.reject('FileService.saveAttachmentBody check _soupEntryId folder error: ' + JSON.stringify(error));
                                    });
                                }, function (error) {

                                    // error
                                    deferred.reject('FileService.saveAttachmentBody removeAttachmentBySids error: ' + JSON.stringify(error));
                                });
                            }, function (error) {
                                // error
                                deferred.reject('FileService.saveAttachmentBody checkAttachmentFolder error: ' + JSON.stringify(error));
                            });

                        }
                    }
                };

                if (!attachment.Name) {
                    navigator.smartstore.retrieveSoupEntries('Attachment', [attachment._soupEntryId], function (entries) {

                        if (entries && entries.length === 1) {
                            attachment = entries[0];

                            saveAttachmentBody();
                        } else {
                            deferred.reject('FileService.saveAttachmentBody not found the Attachment record.');
                        }
                    }, function (error) {
                        // error
                        deferred.reject('FileService.saveAttachmentBody found the Attachment record error: ' + JSON.stringify(error));
                    });
                } else {
                    saveAttachmentBody();
                }

                return deferred.promise;
            };

            /**
             * @ngdoc method
             * @name getAttachmentBody
             * @methodOf oinio.core.service:FileService
             * @description
             * Get attachment body by base64 string
             *
             * @param {object} attachment - attachment soup object
             * @param {object} relatedObjectType - attachment related object type information including encrypted configuration
             *
             * @returns {promise} return the attachment body by base64 string
             */
            service.getAttachmentBody = function (attachment, relatedObjectType) {
                var deferred = $q.defer();

                var getAttachmentBody = function () {

                    // check encrypted of this attachment related object configuration is true
                    // if true get body from soup, otherwise get it from local file system
                    if (relatedObjectType && relatedObjectType['MobileVizArt__Attachments_Encrypted__c']) {

                        // get body data from smartStore
                        var sql = 'select {AttachmentBody:_soup} from {AttachmentBody} where {AttachmentBody:AttachmentSid} = \'' + attachment._soupEntryId + '\'';
                        var querySpec = navigator.smartstore.buildSmartQuerySpec(sql, 1);
                        navigator.smartstore.runSmartQuery(querySpec, function (cursor) {
                            if (cursor && cursor.currentPageOrderedEntries && cursor.currentPageOrderedEntries.length) {
                                var result = cursor.currentPageOrderedEntries[0][0];
                                deferred.resolve(result['Body']);
                            } else {
                                deferred.reject('FileService.getAttachmentBody from soup error: not found in AttachmentBody soup.');
                            }
                        }, function (err) {
                            deferred.reject('FileService.getAttachmentBody from soup error: ' + JSON.stringify(err));
                        });

                    } else {

                        // get body data from file system
                        $cordovaFile.readAsDataURL(getAttachmentFolder() + '/' + attachment._soupEntryId, attachment.Name).then(function (result) {

                            var dataContent = result.substr(result.indexOf(';base64,') + 8, result.length);

                            deferred.resolve(dataContent);
                        }, function (err) {
                            deferred.reject('FileService.getAttachmentBody from local file system error: ' + JSON.stringify(err));
                        });
                    }
                };

                if (!attachment.Name) {
                    navigator.smartstore.retrieveSoupEntries('Attachment', [attachment._soupEntryId], function (entries) {

                        if (entries && entries.length === 1) {
                            attachment = entries[0];

                            getAttachmentBody();
                        } else {
                            deferred.reject('FileService.getAttachmentBody not found the Attachment record.');
                        }
                    }, function (error) {
                        // error
                        deferred.reject('FileService.getAttachmentBody found the Attachment record error: ' + JSON.stringify(error));
                    });
                } else {
                    getAttachmentBody();
                }

                return deferred.promise;
            };

            /**
             * @ngdoc method
             * @name saveFileData
             * @methodOf oinio.core.service:FileService
             * @description
             * Save file data under File folder by _soupEntryId of ContentDocument
             *
             * @param {object} contentDocument - ContentDocument with _soupEntryId for the name of the file stored
             * @param {object|string} fileData - file data for saving (data type is ArrayBuffer or Base64)
             *
             * @returns {promise}
             */
            service.saveFileData = function (contentDocument, fileData) {
                var deferred = $q.defer();

                var saveFileData = function () {

                    var binaryData = fileData;

                    // fileData is arrayBuffer(typeof is object) or base64 string(typeof is string)
                    // if fileData is base64 string
                    if (typeof fileData === 'string') {

                        if (fileData.indexOf(';base64,') !== -1) {
                            fileData = fileData.substr(fileData.indexOf(';base64,') + 8, fileData.length);
                        }

                        binaryData = base64toBlob(fileData);
                    }

                    // check file folder is exist, if not exist, create it
                    checkFileFolder().then(function () {

                        // remove attachment of previous version
                        service.removeFileBySids([contentDocument._soupEntryId]).then(function () {

                            // check _soupEntryId folder is exist, if not exist, create it
                            checkAndCreateDir(getFileFolder(), contentDocument._soupEntryId + '').then(function () {

                                // store file data into file system
                                $cordovaFile.writeFile(getFileFolder() + '/' + contentDocument._soupEntryId, getFileName(contentDocument),
                                    binaryData, true).then(function (success) {

                                        // success
                                        deferred.resolve(true);
                                    }, function (error) {
                                        // error
                                        deferred.reject('FileService.saveFileData into file system error: ' + JSON.stringify(error));
                                    });
                            }, function (error) {

                                // error
                                deferred.reject('FileService.saveFileData check _soupEntryId folder error: ' + JSON.stringify(error));
                            });
                        }, function (error) {

                            // error
                            deferred.reject('FileService.saveFileData removeFileBySids error: ' + JSON.stringify(error));
                        });
                    }, function (error) {
                        // error
                        deferred.reject('FileService.saveFileData checkFileFolder error: ' + JSON.stringify(error));
                    });
                };

                if (!contentDocument.Title) {
                    navigator.smartstore.retrieveSoupEntries('ContentDocument', [contentDocument._soupEntryId], function (entries) {

                        if (entries && entries.length === 1) {
                            contentDocument = entries[0];

                            saveFileData();
                        } else {
                            deferred.reject('FileService.saveFileData not found the ContentDocument record.');
                        }
                    }, function (error) {
                        // error
                        deferred.reject('FileService.saveFileData found the ContentDocument record error: ' + JSON.stringify(error));
                    });
                } else {
                    saveFileData();
                }

                return deferred.promise;
            };

            /**
             * @ngdoc method
             * @name getFileData
             * @methodOf oinio.core.service:FileService
             * @description
             * Get file data by _soupEntryId of ContentDocument
             *
             * @param {object} contentDocument - ContentDocument with _soupEntryId for the name of the file stored
             * @param {string} [returnType] - return file data with which type, such as: "base64", "arrayBuffer", "text", "binaryString", default "base64" string.
             * @param {string} [base64WithHeader] - if return with base64 string, can choose return data whether with base64 header, default is false.
             *
             * @returns {promise} return the file data by base64 string
             */
            service.getFileData = function (contentDocument, returnType, base64WithHeader) {
                var deferred = $q.defer();

                var getFileData = function () {

                    returnType = returnType || 'base64';

                    // get file data from file system
                    readFile(getFileFolder() + '/' + contentDocument._soupEntryId, getFileName(contentDocument), returnType).then(function (result) {

                        if (returnType === 'base64' && !base64WithHeader) {
                            result = result.substr(result.indexOf(';base64,') + 8, result.length);
                        }

                        deferred.resolve(result);
                    }, function (err) {
                        deferred.reject('FileService.getFileData from local file system error: ' + JSON.stringify(err));
                    });
                };

                if (!contentDocument.Title) {
                    navigator.smartstore.retrieveSoupEntries('ContentDocument', [contentDocument._soupEntryId], function (entries) {

                        if (entries && entries.length === 1) {
                            contentDocument = entries[0];

                            getFileData();
                        } else {
                            deferred.reject('FileService.getFileData not found the ContentDocument record.');
                        }
                    }, function (error) {
                        // error
                        deferred.reject('FileService.getFileData found the ContentDocument record error: ' + JSON.stringify(error));
                    });
                } else {
                    getFileData();
                }

                return deferred.promise;
            };

            /**
             * @ngdoc method
             * @name getFilePath
             * @methodOf oinio.core.service:FileService
             * @description
             *
             * @param {object} contentDocumentSid - contentDocument record _soupEntryId
             *
             * @returns {string}
             */
            service.getFilePath = function (contentDocumentSid) {
                var deferred = $q.defer();

                navigator.smartstore.retrieveSoupEntries('ContentDocument', [contentDocumentSid], function (entries) {

                    if (entries && entries.length === 1) {
                        var contentDocument = entries[0];

                        deferred.resolve(getFileFolder() + '/' + contentDocument._soupEntryId + '/' + getFileName(contentDocument));
                    } else {
                        deferred.reject('FileService.getFilePath not found the ContentDocument record.');
                    }
                }, function (error) {
                    // error
                    deferred.reject('FileService.getFilePath found the ContentDocument record error: ' + JSON.stringify(error));
                });

                return deferred.promise;
            };

            /**
             * @ngdoc method
             * @name getFileName
             * @methodOf oinio.core.service:FileService
             * @description
             *
             * @param {object} contentDocument - contentDocument record including _soupEntryId, Title, FileExtension
             *
             * @returns {string}
             */
            function getFileName(contentDocument) {
                var fileName = contentDocument.Title;
                if (!contentDocument['FileExtension'] || _.endsWith(fileName.toLowerCase(), '.' + contentDocument['FileExtension'].toLowerCase())) {
                    return fileName;
                } else {
                    return fileName + '.' + contentDocument['FileExtension'];
                }
            }

            /**
             * @ngdoc method
             * @name getFileSize
             * @methodOf oinio.core.service:FileService
             * @description
             *
             * @param {string} filePath
             * @param {string} fileName
             *
             * @returns byte number
             */
            service.getFileSize = function (filePath, fileName) {
                return $q(function (resolve, reject) {

                    window.resolveLocalFileSystemURL(filePath, function (fileSystem) {

                        fileSystem.getFile(fileName + '', {create: false}, function (fileEntry) {

                            fileEntry.getMetadata(function (metadata) {
                                resolve(metadata.size); // get file size
                            }, function (error) {
                                reject(error);
                            });
                        }, function (error) {
                            reject(error);
                        });
                    }, function (error) {
                        reject(error);
                    });
                });
            };

            /**
             * @ngdoc method
             * @name getDataFileDirectory
             * @methodOf oinio.core.service:FileService
             * @description
             * get the data file directory of device.
             *
             * @returns {string}
             */
            service.getDataFileDirectory = function () {

                if (dataFileRootDirectory) return dataFileRootDirectory;

                if (UtilService.isAndroidOS()) {
                    if (cordova.file.externalDataDirectory) {
                        dataFileRootDirectory = cordova.file.externalDataDirectory;
                    } else {
                        dataFileRootDirectory = cordova.file.dataDirectory;
                    }
                } else {
                    dataFileRootDirectory = cordova.file.documentsDirectory;
                }

                return dataFileRootDirectory;
            };

            /**
             * @ngdoc method
             * @name clearUserFolder
             * @methodOf oinio.core.service:FileService
             * @description
             * Clear current user folder under data file system path.
             *
             * @returns {promise}
             */
            service.clearUserFolder = function () {
                var deferred = $q.defer();

                var currentUser = LocalCacheService.get('currentUser');

                if (currentUser) {
                    $cordovaFile.removeRecursively(service.getDataFileDirectory(), currentUser.Id + '')
                        .then(function (success) {
                            // success
                            deferred.resolve(true);
                        }, function (error) {
                            // error
                            deferred.reject('FileService.clearUserFolder error: ' + JSON.stringify(error));
                        });
                } else {
                    deferred.resolve(true);
                }

                return deferred.promise;
            };

            /**
             * @ngdoc method
             * @name getAllAttachmentFolderNames
             * @methodOf oinio.core.service:FileService
             * @description
             * Get all attachment folder name(_soupEntryId) array.
             *
             * @returns {promise}
             */
            service.getAllAttachmentFolderNames = function () {
                var deferred = $q.defer();

                listDir(getAttachmentFolder(), 'D', true).then(function (folderNames) {
                    deferred.resolve(folderNames);
                }, function (err) {
                    deferred.reject(err);
                });

                return deferred.promise;
            };

            /**
             * @ngdoc method
             * @name removeAttachmentBySids
             * @methodOf oinio.core.service:FileService
             * @description
             * Remove attachment file by attachment _soupEntryId.
             *
             * @param {Array} attachmentSids - attachment _soupEntryId array
             *
             * @returns {promise}
             */
            service.removeAttachmentBySids = function (attachmentSids) {
                var deferred = $q.defer();

                removeFolders(getAttachmentFolder(), attachmentSids).then(function () {
                    deferred.resolve(true);
                }, function (err) {
                    deferred.reject(err);
                });

                return deferred.promise;
            };

            /**
             * @ngdoc method
             * @name removeFileBySids
             * @methodOf oinio.core.service:FileService
             * @description
             * Remove the file under the file folder according to the _soupEntryId of the file
             *
             * @param {Array} contentDocumentSids - contentDocument _soupEntryId array
             *
             * @returns {promise}
             */
            service.removeFileBySids = function (contentDocumentSids) {
                var deferred = $q.defer();

                removeFolders(getFileFolder(), contentDocumentSids).then(function () {
                    deferred.resolve(true);
                }, function (err) {
                    deferred.reject(err);
                });

                return deferred.promise;
            };

            /**
             * @ngdoc method
             * @name changeAttachmentFileName
             * @methodOf oinio.core.service:FileService
             * @description
             * Change attachment file name.
             *
             * @param {string} attachmentSid - attachment _soupEntryId
             * @param {string} oldAttachmentName - old attachment name
             * @param {string} newAttachmentName - new attachment name
             *
             * @returns {promise}
             */
            service.changeAttachmentFileName = function (attachmentSid, oldAttachmentName, newAttachmentName) {
                var deferred = $q.defer();

                var filePath = getAttachmentFolder() + '/' + attachmentSid;

                $cordovaFile.moveFile(filePath, oldAttachmentName, filePath, newAttachmentName)
                    .then(function (success) {
                        // success
                        deferred.resolve(true);
                    }, function (error) {
                        // error
                        deferred.reject(error);
                    });

                return deferred.promise;
            };

            /**
             * @ngdoc method
             * @name changeFileName
             * @methodOf oinio.core.service:FileService
             * @description
             * Change file name under file folder by contentDocument
             *
             * @param {object} oldContentDocument - old contentDocument record including _soupEntryId, Title, FileExtension
             * @param {object} newContentDocument - new contentDocument record including _soupEntryId, Title, FileExtension
             *
             * @returns {promise}
             */
            service.changeFileName = function (oldContentDocument, newContentDocument) {
                var deferred = $q.defer();

                var filePath = getFileFolder() + '/' + oldContentDocument._soupEntryId;

                $cordovaFile.moveFile(filePath, getFileName(oldContentDocument), filePath, getFileName(newContentDocument))
                    .then(function (success) {
                        // success
                        deferred.resolve(true);
                    }, function (error) {
                        // error
                        deferred.reject(error);
                    });

                return deferred.promise;
            };

            /**
             * @ngdoc method
             * @name zip
             * @methodOf oinio.core.service:FileService
             * @description
             * Zip a file or directory, including all of its sub entries.
             * Example:
             * service.zip(getFileFolder(), "test.txt", getFileFolder(), "test.zip");
             *
             * @param {string} targetPath - the target path for the entry to be zipped
             * @param {string} targetEntry - the target entry (file or directory) to be zipped
             * @param {string} zipPath - the path of the directory where the zipped file is placed
             * @param {string} zipFileName - the zip file name
             *
             * @returns {promise}
             */
            service.zip = function (targetPath, targetEntry, zipPath, zipFileName) {
                var deferred = $q.defer();

                if (!_.endsWith(targetPath, '/')) {
                    targetPath += '/';
                }
                if (!_.endsWith(zipPath, '/')) {
                    zipPath += '/';
                }

                var addFileAndDirToZip = function (path, entry, parentDir, zip) {
                    var innerDeferred = $q.defer();
                    parentDir = parentDir || "";

                    // Check target Entry to see if it is not existing, or a file, or a directory.
                    checkFileAndDir(path, entry)
                        .then(function (checkResult) {

                            // entry exists, create a zip and add sub entries to the zip
                            zip = zip || new JSZip();

                            if (checkResult.isFile === true) {

                                // if entry is a file, just add it to the zip object
                                readFile(path, entry, 'arrayBuffer')
                                    .then(function (data) {
                                        zip.file(parentDir + "/" + entry, data);
                                        innerDeferred.resolve(zip);
                                    })
                                    .catch(function (error) {
                                        innerDeferred.reject(error);
                                    });
                            } else if (checkResult.isDir === true) {

                                // if entry is a folder, then list and add all sub entries recursively
                                listDir(path + entry, null, true)
                                    .then(function (subEntries) {
                                        var subPromises = [];
                                        for (var subEntry in subEntries) {
                                            subPromises.push(addFileAndDirToZip(path + entry + '/', subEntries[subEntry], parentDir + "/" + entry, zip));
                                        }
                                        $q.all(subPromises)
                                            .then(function () {
                                                innerDeferred.resolve(zip);
                                            })
                                            .catch(function (error) {
                                                innerDeferred.reject(error);
                                            });
                                    });
                            } else {
                                innerDeferred.reject("Unknown result: " + JSON.stringify(checkResult));
                            }
                        })
                        .catch(function (error) {
                            innerDeferred.reject(error);
                        });

                    return innerDeferred.promise;
                };

                addFileAndDirToZip(targetPath, targetEntry)
                    .then(function (zip) {
                        return zip.generateAsync({
                            compression: "DEFLATE",
                            compressionOptions: {
                                level: 9 // 1 best speed to 9 best compression
                            },
                            type: "blob"
                        });
                    })
                    .then(function (blob) {
                        return $cordovaFile.writeFile(zipPath, zipFileName, blob, true);
                    })
                    .then(function () {
                        deferred.resolve();
                    })
                    .catch(function (error) {
                        deferred.reject(error);
                    });

                return deferred.promise;
            };

            /**
             * @ngdoc method
             * @name checkFileAndDir
             * @methodOf oinio.core.service:FileService
             * @description
             * Check to see if the entry is a file or a directory, or not existing at all.
             *
             * @param {string} path - the path for the entry to be checked
             * @param {string} entry - the entry (file or directory) to be checked
             *
             * @returns {promise}
             */
            function checkFileAndDir(path, entry) {
                var deferred = $q.defer();
                var result = {
                    isFile: false,
                    isDir: false
                };

                if (!_.endsWith(path, '/')) {
                    path += '/';
                }

                // Check if the entry is a file
                $cordovaFile.checkFile(path, entry)
                    .then(function () {

                        // entry is a file
                        result.isFile = true;
                        return deferred.resolve(result);
                    }, function () {

                        // check if the entry is a directory
                        return $cordovaFile.checkDir(path, entry)
                            .then(function () {

                                // entry is a directory
                                result.isDir = true;
                                deferred.resolve(result);
                            });
                    })
                    .catch(function (error) {
                        deferred.reject(error);
                    });

                return deferred.promise;
            }

            /**
             * @ngdoc method
             * @name listDir
             * @methodOf oinio.core.service:FileService
             * @description
             * List directory and file entries of specific path
             *
             * @param {string} path - folder path
             * @param {string} [filterCondition] - 'F': get file entries; 'D': get directory entries; undefined: get all.
             * @param {boolean} [getName] - true: only return file or directory name array; otherwise return entries.
             *
             * @returns {promise}
             */
            function listDir(path, filterCondition, getName) {
                var deferred = $q.defer();

                window.resolveLocalFileSystemURL(path, function (fileSystem) {
                    var reader = fileSystem.createReader();
                    reader.readEntries(function (entries) {
                            var filterEntries = entries;

                            if (filterCondition === 'F') {
                                filterEntries = _.filter(entries, {isFile: true});
                            } else if (filterCondition === 'D') {
                                filterEntries = _.filter(entries, {isDirectory: true});
                            }

                            if (getName) {
                                deferred.resolve(_.pluck(filterEntries, 'name'));
                            } else {
                                deferred.resolve(filterEntries);
                            }
                        }, function (err) {
                            deferred.reject(err);
                        }
                    );
                }, function (err) {
                    deferred.reject(err);
                });

                return deferred.promise;
            }

            /**
             * @ngdoc method
             * @name removeFolders
             * @methodOf oinio.core.service:FileService
             * @description
             * Remove files by their name under specific path
             *
             * @param {string} path - folder path
             * @param {Array} folderNames - folder name array
             * @param {number} [currentIndex] - the current removing folder index of array, default is 0, for invoked by itself.
             * @param {object} [deferred] - not need setting in first time, iterator invoked by itself.
             *
             * @returns {promise}
             */
            function removeFolders(path, folderNames, currentIndex, deferred) {
                currentIndex = (currentIndex === undefined) ? 0 : currentIndex;

                deferred = deferred || $q.defer();

                if (!folderNames || folderNames.length <= currentIndex) {
                    deferred.resolve(true);
                } else {
                    var currentFolderName = folderNames[currentIndex] + '';
                    currentIndex++;

                    $cordovaFile.removeRecursively(path, currentFolderName).then(function (success) {
                        // success
                        removeFolders(path, folderNames, currentIndex, deferred);
                    }, function (error) {
                        // error
                        //console.log(error);
                        removeFolders(path, folderNames, currentIndex, deferred);
                    });
                }

                return deferred.promise;
            }

            /**
             * @ngdoc method
             * @name removeFiles
             * @methodOf oinio.core.service:FileService
             * @description
             * Remove files by their name under specific path
             *
             * @param {string} path - folder path
             * @param {Array} fileNames - file name array
             * @param {number} [currentIndex] - the current removing file index of array, default is 0, for invoked by itself.
             * @param {object} [deferred] - not need setting in first time, iterator invoked by itself.
             *
             * @returns {promise}
             */
            function removeFiles(path, fileNames, currentIndex, deferred) {
                currentIndex = (currentIndex === undefined) ? 0 : currentIndex;

                deferred = deferred || $q.defer();

                if (!fileNames || fileNames.length <= currentIndex) {
                    deferred.resolve(true);
                } else {
                    var currentFileName = fileNames[currentIndex] + '';
                    currentIndex++;

                    $cordovaFile.removeFile(path, currentFileName).then(function (success) {
                        // success
                        removeFiles(path, fileNames, currentIndex, deferred);
                    }, function (error) {
                        // error
                        console.log(error);
                        removeFiles(path, fileNames, currentIndex, deferred);
                    });
                }

                return deferred.promise;
            }

            /**
             * @ngdoc method
             * @name getAttachmentFolder
             * @methodOf oinio.core.service:FileService
             * @description
             * Get the full path of the Attachment folder
             *
             * @returns {string}
             */
            function getAttachmentFolder() {

                var currentUser = LocalCacheService.get('currentUser');

                var attachmentFolderPath = service.getDataFileDirectory() + currentUser.Id + '/' + attachmentFolderName;

                return attachmentFolderPath;
            }

            /**
             * @ngdoc method
             * @name checkAttachmentFolder
             * @methodOf oinio.core.service:FileService
             * @description
             * Check the attachment folder is exist, if not create it.
             *
             * @returns {promise}
             */
            function checkAttachmentFolder() {
                var deferred = $q.defer();

                // whether it is already checked
                if (!attachmentFolderIsChecked) {

                    var currentUser = LocalCacheService.get('currentUser');

                    // check the attachment folder is exist, if not create it
                    checkAndCreateDir(service.getDataFileDirectory(), currentUser.Id + '/' + attachmentFolderName).then(function () {
                        attachmentFolderIsChecked = true;
                        deferred.resolve(true);
                    }, function (error) {

                        // error
                        deferred.reject('FileService.checkAttachmentFolder error: ' + JSON.stringify(error));
                    });
                } else {
                    deferred.resolve(true);
                }

                return deferred.promise;
            }

            /**
             * @ngdoc method
             * @name getFileFolder
             * @methodOf oinio.core.service:FileService
             * @description
             * Get the full path of the file folder
             *
             * @returns {string}
             */
            function getFileFolder() {

                var currentUser = LocalCacheService.get('currentUser');

                var fileFolderPath = service.getDataFileDirectory() + currentUser.Id + '/' + fileFolderName;

                return fileFolderPath;
            }

            /**
             * @ngdoc method
             * @name checkFileFolder
             * @methodOf oinio.core.service:FileService
             * @description
             * Check the file folder is exist, if not create it.
             *
             * @returns {promise}
             */
            function checkFileFolder() {
                var deferred = $q.defer();

                // whether it is already checked
                if (!fileFolderIsChecked) {

                    var currentUser = LocalCacheService.get('currentUser');

                    // check the attachment folder is exist, if not create it
                    checkAndCreateDir(service.getDataFileDirectory(), currentUser.Id + '/' + fileFolderName).then(function () {
                        fileFolderIsChecked = true;
                        deferred.resolve(true);
                    }, function (error) {

                        // error
                        deferred.reject('FileService.checkFileFolder error: ' + JSON.stringify(error));
                    });
                } else {
                    deferred.resolve(true);
                }

                return deferred.promise;
            }

            /**
             * @ngdoc method
             * @name getLogFolder
             * @methodOf oinio.core.service:FileService
             * @description
             * Get the full path of the log folder
             *
             * @returns {string}
             */
            function getLogFolder() {

                var currentUser = LocalCacheService.get('currentUser');

                var logFolderPath = service.getDataFileDirectory() + currentUser.Id + '/' + logFolderName;

                return logFolderPath;
            }

            /**
             * @ngdoc method
             * @name checkLogFolder
             * @methodOf oinio.core.service:FileService
             * @description
             * Check the log folder is exist, if not create it.
             *
             * @returns {promise}
             */
            function checkLogFolder() {
                var deferred = $q.defer();

                // whether it is already checked
                if (!logFolderIsChecked) {

                    var currentUser = LocalCacheService.get('currentUser');

                    // check the attachment folder is exist, if not create it
                    checkAndCreateDir(service.getDataFileDirectory(), currentUser.Id + '/' + logFolderName).then(function () {
                        logFolderIsChecked = true;
                        deferred.resolve(true);
                    }, function (error) {

                        // error
                        deferred.reject('FileService.checkLogFolder error: ' + JSON.stringify(error));
                    });
                } else {
                    deferred.resolve(true);
                }

                return deferred.promise;
            }

            /**
             * @ngdoc method
             * @name initializeLogFolder
             * @methodOf oinio.core.service:FileService
             * @description
             * Controlled by user changing between 'enable' and 'disable' the logging feature for initialization Log folder again.
             *
             * @returns {promise}
             */
            service.initializeLogFolder = function () {
                var deferred = $q.defer();

                var currentUser = LocalCacheService.get('currentUser');

                if (currentUser) {

                    logFolderIsChecked = false;

                    if (Logger.enabled) {

                        checkLogFolder()
                            .then(function () {
                                return cleanLogFolderAndCacheLatest();
                            })
                            .then(function () {
                                deferred.resolve(true);
                            })
                            .catch(function (error) {
                                deferred.reject(error);
                            });
                    } else {

                        removeFolders(service.getDataFileDirectory() + currentUser.Id, [logFolderName]).then(function () {
                            deferred.resolve(true);
                        }, function (error) {
                            deferred.reject(error);
                        });
                    }
                } else {
                    deferred.reject('InitializeLogFolder error: currentUser is null.');
                }

                return deferred.promise;
            };

            /**
             * @ngdoc method
             * @name cleanLogFolderAndCacheLatest
             * @methodOf oinio.core.service:FileService
             * @description
             * Clean expired log files under the log folder and cache latest writing log file name.
             *
             * @returns {*|promise}
             */
            var cleanLogFolderAndCacheLatest = function () {
                var deferred = $q.defer();

                var logFileFolder = getLogFolder() + '/';
                var expiredLogFileNames = [];
                var logFileExpiredTime = LOG_SETTING.LOG_FILE_EXPIRED_TIME || 36;
                var expiredTime = new Date(new Date().getTime() - logFileExpiredTime * 60 * 60 * 1000);
                var latestFileModifiedTime = null;

                var isExpiredFile = function (fileEntry) {
                    var isExpiredFileDeferred = $q.defer();

                    var fileName = fileEntry.name;
                    if (fileName && _.startsWith(fileName, logFileNamePrefix) && _.endsWith(fileName, logFileNameSuffix)) {

                        getMetadataFromFileEntry(fileEntry).then(function (file) {
                            if (!latestFileModifiedTime || latestFileModifiedTime < file.modificationTime) {
                                currentWritingLogFileName = fileName;
                            }
                            latestFileModifiedTime = file.modificationTime;

                            if (file.modificationTime < expiredTime) {
                                expiredLogFileNames.push(fileName);
                                isExpiredFileDeferred.resolve();
                            } else {
                                isExpiredFileDeferred.resolve();
                            }
                        }, function (error) {
                            isExpiredFileDeferred.reject(error);
                        });
                    } else {
                        isExpiredFileDeferred.resolve();
                    }

                    return isExpiredFileDeferred.promise;
                };

                listDir(logFileFolder, 'F')
                    .then(function (fileEntries) {
                        var promises = [];
                        for (var i = 0; i < fileEntries.length; i++) {
                            promises.push(isExpiredFile(fileEntries[i]));
                        }

                        return $q.all(promises);
                    })
                    .then(function () {
                        return removeFiles(logFileFolder, expiredLogFileNames);
                    })
                    .then(function () {
                        deferred.resolve();
                    })
                    .catch(function (error) {
                        deferred.reject(error);
                    });

                return deferred.promise;
            };

            /**
             * @ngdoc method
             * @name readFile
             * @methodOf oinio.core.service:FileService
             * @description
             * Read file with specific type such as: base64, arrayBuffer, text, binaryString, default base64 string.
             *
             * @param {string} filePath
             * @param {string} fileName
             * @param {string} [returnType] - return file data with which type, such as: "base64", "arrayBuffer", "text", "binaryString", default "base64" string.
             *
             * @returns {promise}
             */
            function readFile(filePath, fileName, returnType) {
                var deferred = $q.defer();

                returnType = returnType || 'base64';

                if (returnType === 'base64') {

                    $cordovaFile.readAsDataURL(filePath, fileName)
                        .then(function (result) {
                            // success
                            deferred.resolve(result);
                        }, function (error) {
                            // error
                            deferred.reject('FileService.readFile error: ' + JSON.stringify(error));
                        });
                } else if (returnType === 'arrayBuffer') {

                    $cordovaFile.readAsArrayBuffer(filePath, fileName)
                        .then(function (result) {
                            // success
                            deferred.resolve(result);
                        }, function (error) {
                            // error
                            deferred.reject('FileService.readFile error: ' + JSON.stringify(error));
                        });
                } else if (returnType === 'text') {

                    $cordovaFile.readAsText(filePath, fileName)
                        .then(function (result) {
                            // success
                            deferred.resolve(result);
                        }, function (error) {
                            // error
                            deferred.reject('FileService.readFile error: ' + JSON.stringify(error));
                        });
                } else if (returnType === 'binaryString') {

                    $cordovaFile.readAsBinaryString(filePath, fileName)
                        .then(function (result) {
                            // success
                            deferred.resolve(result);
                        }, function (error) {
                            // error
                            deferred.reject('FileService.readFile error: ' + JSON.stringify(error));
                        });
                } else {
                    deferred.reject('FileService.readFile error: unknown return type');
                }

                return deferred.promise;
            }

            /**
             * @ngdoc method
             * @name checkAndCreateDir
             * @methodOf oinio.core.service:FileService
             * @description
             * Check the folder is exist, if not create it.
             *
             * @param {string} fileSystem - file root path in file system
             * @param {string} dirName - checked directory name
             *
             * @returns {promise}
             */
            function checkAndCreateDir(fileSystem, dirName) {

                var deferred = $q.defer();

                if (!_.endsWith(fileSystem, '/')) {
                    fileSystem += '/';
                }

                var dirlist = dirName.split('/');
                $cordovaFile.checkDir(fileSystem, dirlist[0]).then(function (success) {
                    subCheckAndCreateDir(fileSystem, dirlist).then(function () {
                        deferred.resolve(true);
                    }, function (subErrExisted) {
                        deferred.reject(subErrExisted);
                    });
                }, function (err) {
                    $cordovaFile.createDir(fileSystem, dirlist[0]).then(function () {
                        subCheckAndCreateDir(fileSystem, dirlist).then(function () {
                            deferred.resolve(true);
                        }, function (subErrNotExisted) {
                            deferred.reject(subErrNotExisted);
                        });
                    }, function (err) {
                        deferred.reject(err);
                    });
                });

                return deferred.promise;
            }

            /**
             * @ngdoc method
             * @name subCheckAndCreateDir
             * @methodOf oinio.core.service:FileService
             * @description
             * Check the each sub folder is exist, if not create it.
             *
             * @param {string} fileSystem - file root path in file system
             * @param {array} dirlist - checked directory name hierarchy array
             *
             * @returns {promise}
             */
            function subCheckAndCreateDir(fileSystem, dirlist) {
                var deferred = $q.defer();
                if (dirlist && dirlist.length > 1) {
                    var tempPath = fileSystem + dirlist[0] + '/';
                    dirlist = dirlist.splice(1, dirlist.length);
                    checkAndCreateDir(tempPath, dirlist.join('/')).then(function () {
                        deferred.resolve(true);
                    }, function (err) {
                        deferred.reject(err);
                    });
                } else {
                    deferred.resolve(true);
                }
                return deferred.promise;
            }


            /**
             * @ngdoc method
             * @name arrayBuffer2Base64
             * @methodOf oinio.core.service:FileService
             * @description
             * Convert data from arrayBuffer to base64.
             *
             * @param {object} arrayBuffer - arrayBuffer data
             *
             * @returns {promise}
             */
            function arrayBuffer2Base64(arrayBuffer) {
                var base64 = '';
                var encodings = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

                var bytes = new Uint8Array(arrayBuffer);
                var byteLength = bytes.byteLength;
                var byteRemainder = byteLength % 3;
                var mainLength = byteLength - byteRemainder;

                var a, b, c, d;
                var chunk;

                // Main loop deals with bytes in chunks of 3
                for (var i = 0; i < mainLength; i = i + 3) {
                    // Combine the three bytes into a single integer
                    chunk = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2];

                    // Use bitmasks to extract 6-bit segments from the triplet
                    a = (chunk & 16515072) >> 18; // 16515072 = (2^6 - 1) << 18
                    b = (chunk & 258048) >> 12; // 258048   = (2^6 - 1) << 12
                    c = (chunk & 4032) >> 6; // 4032     = (2^6 - 1) << 6
                    d = chunk & 63;               // 63       = 2^6 - 1

                    // Convert the raw binary segments to the appropriate ASCII encoding
                    base64 += encodings[a] + encodings[b] + encodings[c] + encodings[d];
                }

                // Deal with the remaining bytes and padding
                if (byteRemainder == 1) {
                    chunk = bytes[mainLength];

                    a = (chunk & 252) >> 2; // 252 = (2^6 - 1) << 2

                    // Set the 4 least significant bits to zero
                    b = (chunk & 3) << 4; // 3   = 2^2 - 1

                    base64 += encodings[a] + encodings[b] + '==';
                } else if (byteRemainder == 2) {
                    chunk = (bytes[mainLength] << 8) | bytes[mainLength + 1];

                    a = (chunk & 64512) >> 10; // 64512 = (2^6 - 1) << 10
                    b = (chunk & 1008) >> 4; // 1008  = (2^6 - 1) << 4

                    // Set the 2 least significant bits to zero
                    c = (chunk & 15) << 2; // 15    = 2^4 - 1

                    base64 += encodings[a] + encodings[b] + encodings[c] + '=';
                }

                return base64;
            }

            /**
             * @ngdoc method
             * @name base64toBlob
             * @methodOf oinio.core.service:FileService
             * @description
             * Convert data from base64 to blob
             *
             * @param {string} base64Data - base64 data
             * @param {string} contentType - content type of the data
             *
             * @returns {promise}
             */
            function base64toBlob(base64Data, contentType) {
                contentType = contentType || '';
                var sliceSize = 1024;
                var byteCharacters = atob(base64Data);
                var bytesLength = byteCharacters.length;
                var slicesCount = Math.ceil(bytesLength / sliceSize);
                var byteArrays = new Array(slicesCount);

                for (var sliceIndex = 0; sliceIndex < slicesCount; ++sliceIndex) {
                    var begin = sliceIndex * sliceSize;
                    var end = Math.min(begin + sliceSize, bytesLength);

                    var bytes = new Array(end - begin);
                    for (var offset = begin, i = 0; offset < end; ++i, ++offset) {
                        bytes[i] = byteCharacters[offset].charCodeAt(0);
                    }
                    byteArrays[sliceIndex] = new Uint8Array(bytes);
                }
                return new Blob(byteArrays, {
                    type: contentType
                });
            }

            /**
             * @ngdoc method
             * @name writeLogDataByBuffer
             * @methodOf oinio.core.service:FileService
             * @description
             * Push the log data into the buffer queue array, then waiting for a interval time, write the buffer into log file.
             *
             * @param {string} [logData] - log data
             *
             * @returns {*|promise}
             */
            service.writeLogDataByBuffer = function (logData) {
                if (logData) {
                    tmpLogDataQueue.push(logData);
                }

                if (!writingLogTimerRunning) {
                    writingLogTimerRunning = true;

                    // run timer for waiting to write log data when time is up.
                    $timeout(function () {
                        writeLogData().then(function (success) {
                            writingLogTimerRunning = false;
                            if (tmpLogDataQueue.length > 0) {
                                service.writeLogDataByBuffer();
                            }
                        }, function (error) {
                            writingLogTimerRunning = false;
                            if (tmpLogDataQueue.length > 0) {
                                service.writeLogDataByBuffer();
                            }
                        });
                    }, LOG_SETTING.LOG_FILE_WRITING_INTERVAL_TIME);
                }
            };

            /**
             * @ngdoc method
             * @name writeLogData
             * @methodOf oinio.core.service:FileService
             * @description
             * Write log data into file one by one from the buffer queue array.
             *
             * @param   {object} [deferred] - the first call doesn't need this parameter,
             * but following call need this when the method is invoked recursively
             *
             * @returns {*|promise}
             */
            function writeLogData(deferred) {
                deferred = deferred || $q.defer();

                if (!logFolderIsChecked) {
                    console.log('Log folder is not checked, maybe you haven\'t initialized log folder yet.');
                    deferred.resolve();
                    return deferred.promise;
                }

                var logFileFolder = getLogFolder() + '/';

                // check log folder is exist, if not exist, create it
                checkLogFolder()
                    .then(function () {
                        if (currentWritingLogFileName) {

                            return $cordovaFile.checkFile(logFileFolder, currentWritingLogFileName).then(function (fileEntry) {

                                return getMetadataFromFileEntry(fileEntry).then(function (file) {
                                    if (file.size > logFileSize) {
                                        return true;
                                    } else {
                                        return false;
                                    }
                                }, function (error) {
                                    return true;
                                });
                            }, function (error) {
                                return true;
                            });
                        } else {
                            return true;
                        }
                    })
                    .then(function (newFile) {

                        if (newFile) {
                            currentWritingLogFileName = logFileNamePrefix + $filter('date')(new Date(), logFileNameTimeFormat) + logFileNameSuffix;

                            // Log header data detail include Username, Manufacturer, Model name, Operating system, Operating system version, App name, App version
                            var logHeaderData = Logger.logToFile.headerInfo;

                            return $cordovaFile.writeFile(logFileFolder, currentWritingLogFileName, logHeaderData, true).then(function (success) {
                                // log file written successfully ... nothing to do here
                                console.log('log header info to file done');
                            });
                        }
                    })
                    .then(function () {
                        var largeLogData = tmpLogDataQueue.length > 0 ? tmpLogDataQueue.shift() : '';
                        while (tmpLogDataQueue.length > 0 && largeLogData.length < logFileWritingBatchSize) {
                            largeLogData += tmpLogDataQueue.shift();
                        }

                        return $cordovaFile.writeExistingFile(logFileFolder, currentWritingLogFileName, largeLogData);
                    })
                    .then(function () {
                        if (tmpLogDataQueue.length >= logFileSecondWritingMinSize) {
                            writeLogData(deferred);
                        } else {
                            deferred.resolve();
                        }
                    })
                    .catch(function (error) {
                        console.log('Error occurs: ', error);
                        $log.debug('Write log data error: ' + JSON.stringify(error));
                        deferred.reject(error);
                    });

                return deferred.promise;
            }

            /**
             * @ngdoc method
             * @name getMetadataFromFileEntry
             * @methodOf oinio.core.service:FileService
             * @description
             * Get metadata from fileEntry.
             *
             * @param fileEntry
             *
             * @returns {*|promise}
             */
            var getMetadataFromFileEntry = function (fileEntry) {
                var deferred = $q.defer();

                fileEntry.getMetadata(function (file) {
                    deferred.resolve(file);
                }, function (error) {
                    deferred.reject(error);
                });

                return deferred.promise;
            };

            /**
             * @ngdoc method
             * @name sendLogFileByEmail
             * @methodOf oinio.core.service:FileService
             * @description
             * Send log file by email
             */
            service.sendLogFileByEmail = function () {
                var deferred = $q.defer();

                var currentUser = LocalCacheService.get('currentUser');

                if (logFolderIsChecked && currentUser) {

                    var zipFileName = currentUser.Username + '-log-' + $filter('date')(new Date(), logFileNameTimeFormat) + '.zip';
                    var userFileFolder = service.getDataFileDirectory() + currentUser.Id + '/';

                    // zip all file under Log folder
                    service.zip(userFileFolder, logFolderName, userFileFolder, zipFileName)
                        .then(function () {

                            return $cordovaEmailComposer.isAvailable().then(function () {
                                // is available

                                var email = {
                                    to: LOG_SETTING.SEND_LOG_FILE_EMAIL_TO,
                                    subject: LOG_SETTING.SEND_LOG_FILE_EMAIL_SUBJECT,
                                    body: LOG_SETTING.SEND_LOG_FILE_EMAIL_BODY,
                                    attachments: userFileFolder + zipFileName
                                };
                                return $cordovaEmailComposer.open(email).then(null, function () {

                                    // Callback when user cancelled or sent email.
                                    console.log('User cancelled or sent email.');
                                    deferred.resolve();
                                });
                            }, function () {
                                // not available
                                deferred.reject({message: 'Send log failed, maybe you haven\'t setting one email account at least in your device.'});
                            });
                        })
                        .catch(function (error) {
                            console.log('Error occurs: ', error);
                            deferred.reject(error);
                        })
                        .finally(function () {
                            console.log('Removing log zip file.');
                            return removeFiles(userFileFolder, [zipFileName]);
                        });

                    return deferred.promise;
                }

            };

            /**
             * @ngdoc method
             * @name sendLogFileToSalesforce
             * @methodOf oinio.core.service:FileService
             * @description
             * Send log file to salesforce, if send success, removing all log file in local.
             */
            service.sendLogFileToSalesforce = function () {
                var deferred = $q.defer();

                var currentUser = LocalCacheService.get('currentUser');

                if (logFolderIsChecked && currentUser) {

                    var zipFileName = currentUser.Username + '-log-' + $filter('date')(new Date(), logFileNameTimeFormat) + '.zip';
                    var userFileFolder = service.getDataFileDirectory() + currentUser.Id + '/';
                    var logFileFolder = getLogFolder() + '/';
                    var SalesforceDataService = $injector.get('SalesforceDataService');

                    // zip all file under Log folder
                    service.zip(userFileFolder, logFolderName, userFileFolder, zipFileName)
                        .then(function () {
                            return readFile(userFileFolder, zipFileName);
                        })
                        .then(function (base64Data) {
                            return base64Data.substr(base64Data.indexOf(';base64,') + 8, base64Data.length);
                        })
                        .then(function (contentData) {
                            var networkId = LocalCacheService.get('userInfo')['networkId'];

                            return SalesforceDataService.createContentVersion(null, contentData, zipFileName, zipFileName, 'log file', networkId);
                        })
                        .then(function (contentVersionResp) {
                            return SalesforceDataService.fetchFileIdByContentVersionId(contentVersionResp['id']);
                        })
                        .then(function (fileId) {
                            if (LOG_SETTING.LOG_FILE_UPLOAD_ROUTING) {
                                return SalesforceDataService.addFileShareMemberByRouting(fileId, 'V');
                            } else {
                                return SalesforceDataService.addFileShareMemberByGroupName(fileId, 'C', LOG_SETTING.DEFAULT_LOG_FOLDER);
                            }
                        })
                        .then(function () {
                            return listDir(logFileFolder, 'F', true);
                        })
                        .then(function (logFileNames) {
                            console.log('Removing all log files.');
                            return removeFiles(logFileFolder, logFileNames);
                        })
                        .then(function () {
                            deferred.resolve();
                        })
                        .catch(function (error) {
                            console.log('Error occurs: ', error);
                            deferred.reject(error);
                        })
                        .finally(function () {
                            console.log('Removing log zip file.');
                            return removeFiles(userFileFolder, [zipFileName]);
                        });
                }

                return deferred.promise;
            };

            /**
             * @ngdoc method
             * @name checkLogFolderEmpty
             * @methodOf oinio.core.service:FileService
             * @description
             * Check log folder empty, if empty resolve false.
             */
            service.checkLogFolderEmpty = function () {
                var deferred = $q.defer();

                listDir(getLogFolder(), 'F', true).then(function (logFileNames) {

                    if (logFileNames && logFileNames.length > 0) {
                        deferred.resolve(true);
                    } else {
                        deferred.resolve(false);
                    }
                }, function (error) {
                    deferred.reject(error);
                });

                return deferred.promise;
            };

            /**
             * @ngdoc method
             * @description
             * Rewrite i18n data into i18n file.
             *
             * @param {string} prefixFileName (e.g. "locale-" etc.)
             * @param {Object} i18nJsonData
             * @returns {Promise}
             */
            service.rewriteI18NData = function (prefixFileName, i18nJsonData) {
                var deferred = $q.defer();

                var currentUser = LocalCacheService.get('currentUser');
                var languageLocaleKey = currentUser['LanguageLocaleKey'];

                var i18nDir = 'i18n';
                var i18nFilePath = i18nDir + '/' + prefixFileName + languageLocaleKey + '.json';

                // Write json data into local i18n file.
                // should use dataDirectory instead of applicationDirectory as afpplicationDirectory is read-only, and a custom loader is needed as well
                checkAndCreateDir(cordova.file.dataDirectory, i18nDir)
                    .then(function () {

                        // write to file
                        return $cordovaFile.writeFile(cordova.file.dataDirectory, i18nFilePath, JSON.stringify(i18nJsonData), true);
                    })
                    .then(function (success) {
                        console.log('Rewrite i18n data into ' + i18nFilePath + ' file done.');
                        deferred.resolve(true);
                    })
                    .catch(function (error) {
                        deferred.reject(error);
                    });

                return deferred.promise;
            };
        });
})(angular, _);
