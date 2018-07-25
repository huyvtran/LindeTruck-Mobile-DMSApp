(function () {

    'use strict';

    angular
        .module('oinio.common.directives')
        .directive('httpPrefix', HttpPrefix);

    /**
     * @desc
     *
     * @func HttpPrefix
     * @constructor
     */
    function HttpPrefix() {

        return {
            restrict: 'AEC',
            require: 'ngModel',
            link: function(scope, element, attrs, controller) {

                if (attrs.type !== 'url') {
                    return false;
                }

                function ensureHttpPrefix(value) {
                    if (!value) return value;
                    if ('http://'.indexOf(value) === 0 || 'https://'.indexOf(value) === 0) return value;
                    if (value.indexOf('http://') === 0 || value.indexOf('https://') === 0) return value;

                    controller.$setViewValue('http://' + value);
                    controller.$render();
                    return 'http://' + value;
                }
                controller.$formatters.push(ensureHttpPrefix);
                controller.$parsers.push(ensureHttpPrefix);
            }
        };
    }
})();
