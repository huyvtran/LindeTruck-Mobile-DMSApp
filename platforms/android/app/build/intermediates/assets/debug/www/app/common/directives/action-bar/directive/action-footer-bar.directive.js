(function () {

    'use strict';

    /**
     * @ngdoc directive
     * @name oinio.directive:ActionFooterBar
     *
     * @description
     */
    angular
        .module('oinio.common.directives')
        .directive('actionFooterBar', ActionFooterBar);

    /**
     * @name  $inject
     * @desc  To allow the minifiers to rename the function parameters and still be able to inject the right services.
     *
     * @type {string[]}
     */
    ActionFooterBar.$inject = [];

    /**
     * @func        ActionFooterBar
     * @desc        "@"   ( Text binding / one-way binding )
     *              "="   ( Direct model binding / two-way binding )
     *              "&"   ( Behaviour binding / Method binding  )
     * @constructor
     */
    function ActionFooterBar() {

        return {
            restrict: 'AE',
            scope: {
                config: '='
            },

            link: function (scope, element, attrs) {

                if (scope.config.length >= 1 && scope.config[0].isEdit === true) {
                    scope.isEdit = true;
                }

                if (scope.config.length >= 2 && scope.config[1].isNewContact === true) {
                    scope.isNewContact = true;
                }

                if (scope.config.length >= 3 && scope.config[2].isNewTask === true) {
                    scope.isNewTask = true;
                }

                if (scope.config.length >= 4 && scope.config[3].isLogACall === true) {
                    scope.isLogACall = true;
                }

                if (scope.config.length >= 5 && scope.config[4] !== undefined && scope.config[4].isNewVisit === true) {
                    scope.isNewVisit = true;
                }

                /**
                 * @desc open edit modus.
                 */
                scope.editDetails = function () {
                    scope.config[0].callback();
                };

                /**
                 * @desc open new contact form.
                 */
                scope.newContact = function () {
                    scope.config[1].callback();
                };

                /**
                 * @desc open new contact form.
                 */
                scope.newTask = function () {
                    scope.config[2].callback();
                };

                /**
                 * @desc open new contact form.
                 */
                scope.logACall = function () {
                    scope.config[3].callback();
                };

                /**
                 * @desc open new visit process view.
                 */
                scope.newVisit = function () {
                    if (scope.config[4].callback !== undefined) {
                        scope.config[4].callback();
                    }
                };
            },

            templateUrl: 'app/common/directives/action-bar/templates/action-footer-bar.view.html'
        };
    }
})();