(function () {

    'use strict';

    /**
     * Module oinio.common.services PermissionService
     */
    angular.module('oinio.common.services')
        .constant('PERMISSIONS_SET', {
            'ADMIN': 'Avanto_Community_Permissions_Customer_Admin',
            'ENGINEER': 'Avanto_Community_Permissions_Customer_Engineer',
            'STANDARD': 'Avanto_Community_Permissions_Customer_Standard'
        })
        /*.constant('PERMISSIONS_SET', {
            'ADMIN': 'ISW_Community_Permissions_Customer_Admin',
            'ENGINEER': 'ISW_Community_Permissions_Customer_Engineer',
            'STANDARD': 'ISW_Community_Permissions_Customer_Standard'
        })*/
        .service('PermissionService', function PermissionService(PERMISSIONS_SET, LocalCacheService) {
            var userPermissionSets = null;

            function loadPermissionSet() {
                if (!userPermissionSets) {
                    var userInfo = LocalCacheService.get('userInfo');

                    if (userInfo) {
                        userPermissionSets = userInfo['assignedPermissionSets'];
                    }

                    if (!userPermissionSets) {
                        userPermissionSets = [];
                    }
                }

                return userPermissionSets;
            }

            /**
             * checks if current user has an Admin permission set
             * @returns {boolean}
             */
            this.userIsAdmin = function () {
                for (var i = 0; i < loadPermissionSet().length; i++) {
                    var permissionSet = userPermissionSets[i];
                    if (permissionSet.Name === PERMISSIONS_SET.ADMIN) {
                        return true;
                    }
                }

                return false;
            };

            /**
             * checks if current user has an Engineer permission set
             * @returns {boolean}
             */
            this.userIsEngineer = function () {
                for (var i = 0; i < loadPermissionSet().length; i++) {
                    var permissionSet = userPermissionSets[i];
                    if (permissionSet.Name === PERMISSIONS_SET.ENGINEER) {
                        return true;
                    }
                }

                return false;
            };

            /**
             * checks if current user has an Standard permission set
             * @returns {boolean}
             */
            this.userIsStandard = function () {
                for (var i = 0; i < loadPermissionSet().length; i++) {
                    var permissionSet = userPermissionSets[i];
                    if (permissionSet.Name === PERMISSIONS_SET.STANDARD) {
                        return true;
                    }
                }

                return false;
            };

            /**
             * checks if current user has an Standard permission set
             * @returns {boolean}
             */
            this.userIsAdminOrEngineer = function () {
                for (var i = 0; i < loadPermissionSet().length; i++) {
                    var permissionSet = userPermissionSets[i];
                    if (permissionSet.Name === PERMISSIONS_SET.ENGINEER || permissionSet.Name === PERMISSIONS_SET.ADMIN) {
                        return true;
                    }
                }

                return false;
            };
        });
})();
