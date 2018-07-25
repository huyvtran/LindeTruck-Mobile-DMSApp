(function () {

    'use strict';

    angular
        .module('oinio.common.directives')
        .directive('oHeaderTitlePosition', HeaderTitlePosition);

    /**
     * @desc
     *
     * @func HeaderTitlePosition
     * @constructor
     */
    function HeaderTitlePosition() {

        return {
            restrict: 'A',
            link: function (scope, element) {
                scope.$on('$ionicView.afterEnter', function () {

                    // get count of all div's with class ".buttons" in header
                    var nButtonsEleCount = element[0].querySelectorAll('.buttons').length;

                    if (nButtonsEleCount > 0) {

                        var titleElement = angular.element('.title');

                        if (nButtonsEleCount === 2) {
                            var leftButtons  = element[0].querySelector('.buttons:first-child').clientWidth;
                            // var rightButtons = element[0].querySelector('.buttons:last-child').clientWidth;

                            titleElement.css('left', leftButtons + 'px');
                            titleElement.css('right', leftButtons + 'px');

                        } else {
                            var button  = element[0].querySelector('.buttons') || '';
                            var buttonOffsetWidth = button ? button.offsetLeft : 0;

                            if (buttonOffsetWidth < 10) {
                                titleElement.css('left', button ? button.clientWidth : '0' + 'px');
                                titleElement.css('right', button ? button.clientWidth : '0' + 'px');

                            } else {
                                titleElement.css('left', button ? button.clientWidth : '0' + 'px');
                                titleElement.css('right', button ? button.clientWidth : '0' + 'px');
                            }
                        }

                        // set css opacity && transition property
                        titleElement.css('opacity', '1');
                        titleElement.css('transition', 'opacity 0.5s linear;');
                    }
                });
            }
        };
    }
})();
