(function () {

    'use strict';

    angular
        .module('oinio.common.directives')
        .directive('restrictDecimals', function () {
            return {
                require: 'ngModel',
                link: function (scope, element, attr, ngModelCtrl) {
                    function fromUser(text) {
                        if (text) {
                            // replace all non digits
                            var transformedInput = text.replace(/[^0-9.,]/g, '');

                            // replace comma with dot
                            transformedInput = transformedInput.replace(/,/g, '.');

                            // replace every additional dot
                            var nth = 0;
                            transformedInput = transformedInput.replace(/[.]/g, function (match) {
                                nth++;
                                return (nth === 2) ? '' : match;
                            });

                            if (transformedInput !== text) {
                                ngModelCtrl.$setViewValue(transformedInput);
                                ngModelCtrl.$render();
                            }
                            return transformedInput;
                        }
                        return undefined;
                    }

                    ngModelCtrl.$parsers.push(fromUser);
                }
            };
        });
})();
