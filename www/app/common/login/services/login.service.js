/**
 * Module oinio.core LoginService
 */
angular.module('oinio.common.login')
    .service('LoginService', function ($q, $log, UtilService) {
        var service = this;

        /**
         * @desc query user from global soup
         * @param {string} username
         * @returns {Promise}
         */
        var queryUser = function (username) {
            var deferred = $q.defer();

            var user = null;

            var querySpec = navigator.smartstore.buildExactQuerySpec('username', username, 1);

            navigator.smartstore.querySoup(true, '_user', querySpec, function (cursor) {

                var currentPageEntries = cursor.currentPageOrderedEntries;

                angular.forEach(currentPageEntries, function (entry) {
                    user = entry;
                });

                deferred.resolve(user);
            }, function (error) {
                alert('Error in LoginService - queryUser(): ' + error);
            });

            return deferred.promise;
        };

        /**
         * @desc check if user was already logged in
         * @param {string} username
         * @returns {Promise}
         */
        service.localUserExists = function (username) {
            var deferred = $q.defer();

            queryUser(username).then(function (user) {
                if (user !== null) {
                    deferred.resolve(true);
                } else {
                    deferred.resolve(false);
                }
            });

            return deferred.promise;
        };

        /**
         * @desc set local password for user
         * @param {string} username
         * @param {string} password
         * @param {string} question
         * @param {string} answer
         * @returns {*}
         */
        service.setLocalUserPassword = function (username, password, question, answer) {
            var deferred = $q.defer();
            var user = {
                username: username,
                password: password,
                question: question,
                answer: answer
            };

            navigator.smartstore.upsertSoupEntriesWithExternalId(true, '_user', [user], 'username', function (success) {
                $log.debug('>>>> setLocalUserPassword result for [' + username + ']: ' + JSON.stringify(success));
                deferred.resolve(new UtilService.Result(true, 'password set'));
            }, function (error) {
                alert(error);
            });

            return deferred.promise;
        };

        /**
         * @desc
         * @param {string} username
         * @param {string} password
         * @returns {promise}
         */
        service.loginAsLocalUser = function (username, password) {
            var deferred = $q.defer();

            queryUser(username).then(function (user) {
                if (user && user.password === password) {
                    deferred.resolve(new UtilService.Result(true, 'logged in'));
                } else {
                    deferred.resolve(new UtilService.Result(false, 'not logged in'));
                }
            });

            return deferred.promise;
        };

        /**
         * @desc load all Data from User by name
         * @param {string} username
         * @returns {promise}
         */
        service.getDataFromUser = function (username) {
            var deferred = $q.defer();

            queryUser(username).then(function (user) {
                if (user) {
                    deferred.resolve(user);
                }
            });

            return deferred.promise;
        };
    });
