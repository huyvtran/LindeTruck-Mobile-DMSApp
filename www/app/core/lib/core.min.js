angular.module('oinio.core', ['oinio.settings', 'ionic-datepicker']).config(function ($sceDelegateProvider, $sceProvider) {
    $sceDelegateProvider.resourceUrlWhitelist([
        'self',
        new RegExp("(https?:\\/\\/(.+?\\.)?(salesforce|force)\\.com(\\/[A-Za-z0-9\\-\\._~:\\/\\?#\\[\\]@!$&'\\(\\)\\*\\+,;\\=]*)?)")
    ]);
    //$sceProvider.enabled(false);
});

angular.module('oinio.core.components', ['oinio.core']);

(function (angular) {
    'use strict';

    angular.module('oinio.core.error', [])
        .constant('HTTP_DEFAULT_ERROR_MSG', 'An error has occured. Please contact customer support for assistance.')
        .constant('HTTP_NETWORK_ERROR_MSG', 'Unable to communicate with the server. Make sure you are connected to the internet and try again.')
        .constant('SCRIPT_ERROR_MSG', 'An error has occured and the details have been logged. Please contact customer support for assistance.')
        .constant('LOGGING_URL', 'An error has occured and the details have been logged. Please contact customer support for assistance.')
        .constant('EXCEPTION_SEVERITY', {
            IGNORABLE: 'ignorable',
            NOTEWORTHY: 'noteworthy',
            RECOVERABLE: 'recoverable',
            NON_RECOVERABLE: 'non-recoverable'
        })
        .constant('PROCESS_CODE', {
            SYNC_ENGINE: '100'
        })
        .constant('STATUS_CODE', {
            SMART_QUERY_FAILED: '997',
            RECORD_NULL: '998',
            OTHER: '999'
        })
        .config(function ($httpProvider, $provide) {

            $httpProvider.interceptors.push(function ($q, $rootScope, HTTP_DEFAULT_ERROR_MSG, HTTP_NETWORK_ERROR_MSG) {
                return {
                    'requestError': function (rejection) {
                        var message = rejection.headers('status-text') || HTTP_DEFAULT_ERROR_MSG;
                        if (rejection.status === 0) {
                            message = HTTP_NETWORK_ERROR_MSG;
                        }
                        $rootScope.$broadcast('error', message);
                        return $q.reject(rejection);
                    },
                    responseError: function (response) {
                        var message = response.headers('status-text') || HTTP_DEFAULT_ERROR_MSG;
                        if (response.status === 0) {
                            message = HTTP_NETWORK_ERROR_MSG;
                        }
                        $rootScope.$broadcast('error', message);
                        return $q.reject(response);
                    }
                };
            });

            $provide.decorator('$exceptionHandler', function ($delegate, $injector, APP_SETTINGS, EXCEPTION_SEVERITY) {

                var logError = function (exception, cause) {

                    var SCRIPT_ERROR_MSG = $injector.get('SCRIPT_ERROR_MSG');

                    // Using injector to get around cyclic dependencies
                    $injector.get('$rootScope').$broadcast('error', SCRIPT_ERROR_MSG);

                    var data = {type: 'angular', url: window.location.href, localTime: Date.now()};

                    if (cause) {
                        data.cause = cause;
                    }

                    if (exception) {
                        if (exception.severity) {
                            data.severity = exception.severity;
                        }
                        if (exception.code) {
                            data.code = exception.code;
                        }
                        if (exception.message) {
                            data.message = exception.message;
                        }
                        if (exception.stacktrace) {
                            data.stacktrace = exception.stacktrace;
                        }
                        if (exception.rawException) {
                            data.rawException = exception.rawException;
                        }
                        if (exception.localTime) {
                            data.localTime = exception.localTime;
                        }
                        if (exception.name) {
                            data.name = exception.name;
                        }
                        if (exception.stack) {
                            data.stack = exception.stack;
                        }
                        if (exception.column) {
                            data.column = exception.column;
                        }
                        if (exception.line) {
                            data.line = exception.line;
                        }
                        if (exception.sourceURL) {
                            data.sourceURL = exception.sourceURL;
                        }
                    }

                    $delegate(data);
                };

                var redirectRoute = function () {

                    $injector.get('MetaService').getMetaValueEnhance('initialized').then(function (appInitialized) {
                        if (appInitialized) {
                            $injector.get('$state').go($injector.get('APP_SETTINGS').START_VIEW);
                        } else {

                            // Clear up user folders
                            $injector.get('FileService').clearUserFolder().then(function () {
                                cordova.require('com.salesforce.plugin.sfaccountmanager').logout();
                            }, function (error) {
                                throw error;
                            });
                        }
                    }, function (error) {
                        throw error;
                    });
                };

                return function (exception, cause) {

                    // This would log errors by default, so there is no need to log errors in the switch exception.severity below.
                    logError(exception, cause);

                    var IonicLoadingService = $injector.get('IonicLoadingService');
                    var $ionicPopup = $injector.get('$ionicPopup');
                    var $window = $injector.get('$window');
                    var $filter = $injector.get('$filter');

                    if (exception.severity) {
                        switch (exception.severity) {
                            case EXCEPTION_SEVERITY.IGNORABLE:
                                break;

                            case EXCEPTION_SEVERITY.NOTEWORTHY:

                                $window.plugins.toast.showWithOptions({
                                    message: exception.message,
                                    duration: 2500,
                                    position: 'bottom',
                                    styling: {
                                        opacity: 1.0, // 0.0 (transparent) to 1.0 (opaque). Default 0.8
                                        backgroundColor: '#54698d', // make sure you use #RRGGBB. Default #333333
                                        textColor: '#FFFFFF', // Ditto. Default #FFFFFF
                                        textSize: 13, // Default is approx. 13.
                                        cornerRadius: 4, // minimum is 0 (square). iOS default 20, Android default 100
                                        horizontalPadding: 24, // iOS default 16, Android default 50
                                        verticalPadding: 12 // iOS default 12, Android default 30
                                    }
                                });

                                break;

                            case EXCEPTION_SEVERITY.RECOVERABLE:

                                IonicLoadingService.hide();

                                var confirmPopup = $ionicPopup.confirm({
                                    title: 'ERROR: ' + exception.code,
                                    template: exception.message,
                                    okText: ($filter('translate')('cl.global.btn_retry') === 'cl.global.btn_retry') ? 'RETRY' : $filter('translate')('cl.global.btn_retry'),
                                    cancelText: ($filter('translate')('cl.global.btn_cancel') === 'cl.global.btn_cancel') ? 'CANCEL' : $filter('translate')('cl.global.btn_cancel')
                                });
                                confirmPopup.then(function (res) {
                                    if (res) {
                                        if (typeof exception.retry === 'function') {
                                            var retryResult = null;
                                            if (exception.retryContext || exception.retryParam) {
                                                var retryArgs = Array.isArray(exception.retryParam) ? exception.retryParam : [exception.retryParam];
                                                retryResult = exception.retry.apply(exception.retryContext, retryArgs);
                                            } else {
                                                retryResult = exception.retry();
                                            }

                                            if (exception.retryDeferred !== undefined && typeof retryResult.then === 'function') {
                                                retryResult.then(function (success) {

                                                    // This resolves the innerest deferred, and it would in turn resolve to the upmost deferred.
                                                    exception.retryDeferred.resolve(success);
                                                }, function (error) {
                                                    exception.retryDeferred.reject(error);
                                                }, function (notify) {
                                                    exception.retryDeferred.notify(notify);
                                                });
                                            }
                                        } else {
                                            redirectRoute();
                                        }
                                    } else {
                                        if (typeof exception.cancel === 'function') {
                                            exception.cancel();
                                        } else {
                                            redirectRoute();
                                        }
                                    }
                                });

                                break;

                            case EXCEPTION_SEVERITY.NON_RECOVERABLE:

                                IonicLoadingService.hide();

                                var alertPopup2 = $ionicPopup.alert({
                                    title: 'ERROR: ' + exception.code,
                                    template: exception.message,
                                    okText: ($filter('translate')('cl.global.btn_ok') === 'cl.global.btn_ok') ? 'OK' : $filter('translate')('cl.global.btn_ok')
                                });
                                alertPopup2.then(function (res) {
                                    redirectRoute();
                                });

                                break;
                        }
                    }
                };
            });
        })
        .factory('Exception', function ($exceptionHandler, EXCEPTION_SEVERITY, PROCESS_CODE, STATUS_CODE, Logger) {

            var _classCallCheck = function (instance, Constructor) {
                if (!(instance instanceof Constructor)) {
                    throw new TypeError("Cannot call a class as a function");
                }
            };

            var _possibleConstructorReturn = function (self, call) {
                if (!self) {
                    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
                }
                return call && (typeof call === "object" || typeof call === "function") ? call : self;
            };

            var _inherits = function (subClass, superClass) {
                if (typeof superClass !== "function" && superClass !== null) {
                    throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
                }
                subClass.prototype = Object.create(superClass && superClass.prototype, {
                    constructor: {
                        value: subClass,
                        enumerable: false,
                        writable: true,
                        configurable: true
                    }
                });
                if (superClass) {
                    Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
                }
            };

            var CommonError = function (_Error) {
                _inherits(CommonError, _Error);

                function CommonError(severity, code, message, stacktrace, rawException, retry, cancel, retryContext, retryParam, retryDeferred) {
                    _classCallCheck(this, CommonError);

                    var _this = _possibleConstructorReturn(this, (CommonError.__proto__ || Object.getPrototypeOf(CommonError)).call(this, message));

                    _this.severity = severity;
                    _this.code = code;
                    _this.message = message;
                    _this.stacktrace = stacktrace;
                    _this.rawException = rawException;
                    _this.retry = retry;
                    _this.cancel = cancel;
                    _this.retryContext = retryContext;
                    _this.retryParam = retryParam;
                    _this.retryDeferred = retryDeferred;
                    _this.localTime = Date.now();
                    _this.handle = function (processCode) {
                        processCode = processCode || PROCESS_CODE.SYNC_ENGINE;
                        if (this.code && (this.code + '').length === 3) {
                            this.code = processCode + this.code;
                        } else if (!this.code || this.code === "") {
                            this.code = processCode + STATUS_CODE.OTHER;
                        }
                        if (this.severity === EXCEPTION_SEVERITY.IGNORABLE || this.severity === EXCEPTION_SEVERITY.NOTEWORTHY) {
                            $exceptionHandler(this);
                        } else if (this.severity === EXCEPTION_SEVERITY.RECOVERABLE || this.severity === EXCEPTION_SEVERITY.NON_RECOVERABLE) {
                            throw this;
                        }
                    };

                    // Use default error message according to raw error's status if message is empty.
                    if ((!_this.message || _this.message === "") && rawException) {
                        _this.message = Logger.getErrorMessage(rawException);
                    }

                    return _this;
                }

                return CommonError;
            }(Error);

            return CommonError;
        });
})(angular);

(function (angular) {
    'use strict';

    angular.module('oinio.core.logger', [])
        .config(function ($provide) {

            // overwrite angularjs $log
            $provide.decorator('$log', function ($delegate, Logger) {
                Logger.enabled = true;
                var methods = {
                    debug: function () {
                        if (Logger.enabled) {
                            //$delegate.debug.apply($delegate, arguments);
                            Logger.debug.apply(null, arguments);
                        }
                    },
                    error: function () {
                        if (Logger.enabled) {
                            //$delegate.error.apply($delegate, arguments);
                            Logger.error.apply(null, arguments);
                        }
                    },
                    log: function () {
                        if (Logger.enabled) {
                            //$delegate.log.apply($delegate, arguments);
                            Logger.log.apply(null, arguments);
                        }
                    },
                    info: function () {
                        if (Logger.enabled) {
                            //$delegate.info.apply($delegate, arguments);
                            Logger.info.apply(null, arguments);
                        }
                    },
                    warn: function () {
                        if (Logger.enabled) {
                            //$delegate.warn.apply($delegate, arguments);
                            Logger.warn.apply(null, arguments);
                        }
                    }
                };
                return methods;
            });
        });
})(angular);

angular.module('oinio.core.modal', ['oinio.core']);
angular.module('oinio.core.detail', ['oinio.core','oinio.core.pageLayoutRenderer']);

angular.module('oinio.core.object-home', ['oinio.core']);

'use strict';

angular.module('oinio.core.pageLayoutRenderer', []);

(function () {
    'use strict';

    /**
     * AddressFormatter- filter to format the address string as per the address format for the user's locale
     * The address pattern for this filter should look like
     * 'street/<\n>/postalCode/< >/city/<\n>/state/<,>/country'
     * where separators like , or space or line breaks are specified in <> and each item is separated by a /
     * The string to be formatted should be a JSON object like
     * {"street" : "", "city" : "", "country" : "", "postalCode" : "", "state" : "BY"}
     */

    angular.module('oinio.core')
        .filter('addressFormatter', function (LocalesService) {
            return function (addressToFormat) {
                if (!addressToFormat) {
                    return addressToFormat;
                }
                var addressPattern = LocalesService.getAddressFormat();
                if (!addressPattern) {
                    return addressToFormat;
                }
                var addressItems = addressPattern.split('/');
                var addressItem;
                var separator;
                var startOfSeparator;
                var endOfSeparator;
                var formattedAddress = '';
                var addressToFormatJSON;
                if (typeof(addressToFormat) === 'string') {
                    addressToFormatJSON = JSON.parse(addressToFormat);
                }
                else if (typeof(addressToFormat) === 'object') {
                    addressToFormatJSON = addressToFormat;
                }
                else {
                    return addressToFormat;
                }

                for (var i = 0; i < addressItems.length; i++) {
                    addressItem = addressItems[i];
                    if (addressItem) {
                        if (addressItem.indexOf('<') >= 0) {
                            startOfSeparator = addressItem.indexOf('<');
                            endOfSeparator = addressItem.indexOf('>');
                            separator = addressItem.slice(startOfSeparator + 1, endOfSeparator);
                            formattedAddress = formattedAddress + separator;
                        }
                        else if (addressToFormatJSON[addressItem] !== undefined && addressToFormatJSON[addressItem] !== null) {
                            formattedAddress = formattedAddress + addressToFormatJSON[addressItem];
                        }
                    }
                }
                return formattedAddress;
            };
        });
})();

(function () {
    'use strict';
    /**
     * Module oinio.core currencyByIsoCodeFormatter
     * currencyByIsoCodeFormatter- filter that formats the currency string using the currencyISOCode
     */
    angular.module('oinio.core')
        .filter('currencyByIsoCodeFormatter', function ($filter, LocalesService) {
            return function (valueToFormat, currencyIsoCode) {
                currencyIsoCode = currencyIsoCode || LocalesService.getCurrencyIsoCode(); //if the currencyISOCode is specified use it otherwise use the defaultCurrencyISOCode form the user settings
                return currencyIsoCode + ' ' + $filter('numberFormatter')(valueToFormat);
            };
        });
})();

(function () {
    'use strict';
    /**
     * Module oinio.core currencyFormatter
     * currencyFormatter- filter that formats the currency string as per the currency pattern in user's locale
     */
    angular.module('oinio.core')
        .filter('currencyFormatter', function ($filter, LocalesService) {
            return function (valueToFormat) {
                if (LocalesService.getCurrencySymbolBefore()) {
                    return LocalesService.getCurrencySymbol() + ' ' + $filter('numberFormatter')(valueToFormat);
                }
                else {
                    return $filter('numberFormatter')(valueToFormat) + ' ' + LocalesService.getCurrencySymbol();
                }
            };
        });
})();

(function () {
    'use strict';
    /**
     * Module oinio.core dateFormatter
     * dateFormatter- filter that formats the date string as per the date Pattern for the user's locale
     */
    angular.module('oinio.core')
        .filter('dateFormatter', function ($filter, LocalesService) {
            return function (dateToFormat) {
                return $filter('date')(dateToFormat, LocalesService.getDateFormat());
            };
        });
})();

(function () {
    'use strict';
    /**
     * Module oinio.core dateTimeFormatter
     * dateTimeFormatter- filter that formats the dateTime string as per the dateTime Pattern for the user's locale
     */
    angular.module('oinio.core')
        .filter('dateTimeFormatter', function ($filter, LocalesService) {
            return function (dateTimeToFormat) {
                return $filter('date')(dateTimeToFormat, LocalesService.getDateTimeFormat());
            };
        });
})();

(function (angular, _) {
    'use strict';

    angular.module('oinio.core')
        .filter('fieldLabel', function ($filter) {
            return function (field) {
                var result;
                if (field.fieldTranslateKey) {
                    var fieldTranslateLabel = $filter('translate')(field.fieldTranslateKey);
                    // remove last ID
                    if (_.endsWith(fieldTranslateLabel, ' ID')) {
                        fieldTranslateLabel = fieldTranslateLabel.substring(0, fieldTranslateLabel.length - 2).trim();
                    }

                    result = fieldTranslateLabel;

                    if (field.refer2FieldTranslateKey) {
                        var referenceToFieldLabel = $filter('translate')(field.refer2FieldTranslateKey);
                        // remove all fieldTranslateLabel in referenceToFieldName
                        if (referenceToFieldLabel) {
                            var reg = new RegExp(fieldTranslateLabel, 'g');
                            referenceToFieldLabel = referenceToFieldLabel.replace(reg, '');
                            result += ' ' + referenceToFieldLabel;
                        }
                    }
                }

                return result;
            };
        });
})(angular, _);

(function () {
    'use strict';
    /**
     * Module oinio.core numberFormatter
     * numberFormatter- filter that formats the number string as per the number Pattern for the user's locale
     */
    angular.module('oinio.core')
        .filter('numberFormatter', function ($filter, $locale, LocalesService) {
            return function (numberToFormat) {
                if ($locale.NUMBER_FORMATS.DECIMAL_SEP !== '.') {
                    //the number filter works only where decimal separator is '.' so if any other deciaml separator like ',' is used, repalce it with '.'
                    numberToFormat = numberToFormat ? numberToFormat.toString().trim().replace($locale.NUMBER_FORMATS.DECIMAL_SEP, '.') : '';
                }
                return $filter('number')(numberToFormat, LocalesService.getDecimalPlaces());
            };
        });
})();

(function () {
    'use strict';
    /**
     * Module oinio.core timeFormatter
     * timeFormatter- filter that formats the time string as per the time Pattern for the user's locale
     */
    angular.module('oinio.core')
        .filter('timeFormatter', function ($filter, LocalesService) {
            return function (timeToFormat) {
                return $filter('date')(timeToFormat, LocalesService.getTimeFormat());
            };
        });
})();

// $ionicScrollDelegate not working for content in modals
// as described here: https://github.com/driftyco/ionic/issues/2754
// So using an intermediary service until it's fixed.
// Change to return standard and it should use native functionality.
angular.module('oinio.core.pageLayoutRenderer')
    .service('customScrollDelegateService', function ($ionicScrollDelegate) {

        var custom = {
            $getByHandle: function(name) {
                var instances = $ionicScrollDelegate.$getByHandle(name)._instances;
                return instances.filter(function(element) {
                    return (element['$$delegateHandle'] == name);
                })[0];
            }
        };

        return custom;

    });

angular.module('oinio.core.pageLayoutRenderer')
    .service('localizeService', function ($http, $filter) {
        /**
         * function to receive a localized string from a field and fieldtype
         * @param {object} value
         * @param {string} type
         * @param {object} params
         * @returns {*}
         */
        this.getFormattedString = function (value, type, params) {
            var scale;
            if (!value) {
                return '';
            }
            // setting default values
            if (!params || !params.scale) {
                scale = 2;
            }
            // variable for the formatted string
            var formatted;
            // switch for the different field types
            switch (type) {
                case 'date':
                    formatted = $filter('dateFormatter')(value);
                    break;
                case 'datetime':
                    formatted = $filter('dateTimeFormatter')(value);
                    break;
                case 'percent':
                    formatted = $filter('numberFormatter')(value) + ' %';
                    break;
                case 'currency':
                    formatted = $filter('currencyByIsoCodeFormatter')(value);
                    break;
                case 'int':
                    formatted = $filter('number')(value, '0');
                    break;
                case 'double':
                    formatted = $filter('numberFormatter')(value);
                    break;
                case 'address':
                    formatted = $filter('addressFormatter')(value);//value.street + ', ' + value.postalCode + " " + value.city + " " + value.state + "/" + value.country;
                    break;
                case 'boolean':
                    formatted = value ? 'yes' : 'no';
                    break;
                default:
                    formatted = value;
            }
            return formatted;
        };

        /**
         * function to recieve a reference name from an sobject
         * @param {object} sobject
         * @param {string} relationshipName
         * @param {string} objectType
         * @returns {*}
         */




        this.getObjectURL = function (sobject, relationshipName) {
            if (!sobject[relationshipName]) {
                return '';
            }

            return "{objectType: '" + sobject[relationshipName]['type'] + "', sid: " + sobject[relationshipName]['_soupEntryId'] + '}';
        };

        this.getReferenceLabel = function (sobject, relationshipName, objectType) {
            var referencedField;
            // no reference? return empty string
            if (!sobject[relationshipName]) {
                return '';
            }

            // salesforce specials for objects with no name fields
            switch (objectType) {
                case 'Task' :
                case 'Event' :
                case 'Attachment' :
                case 'Case' :
                    referencedField = 'Subject';
                    break;
                default:
                    referencedField = 'Name';
            }
            // return the reference label
            return sobject[relationshipName][referencedField];
        };

        /**
         * get the label (translated) of a picklist value
         * @param {object} sobject
         * @param {string} picklist
         * @param {array} values
         * @returns {string}
         */
        this.getPicklistLabel = function (sobject, picklist, values) {
            var label = '';
            var selectedValue = sobject[picklist];

            if (selectedValue) {
                for (var i = 0; i < values.length; i++) {
                    if (values[i].value === selectedValue)
                    {
                        label = values[i].label;
                        break;
                    }
                }
            }

            return label;
        };

        /**
         * @description get the labels (translated) of a multiPicklist values
         * @param {object} sobject
         * @param {string} picklist
         * @param {array} values
         * @return {string}
         */
        this.getMultiPicklistLabel = function (sobject, picklist, values) {
            var sMulitPicklistLabels    = '',
                sSelectedValues         = sobject[picklist];

            if (sSelectedValues) {
                var aSelectedValues         = sSelectedValues.split(';'),
                    aMulitPicklistLabels    = [];

                for (var i = 0; i < values.length; i++) {
                    if (aSelectedValues.indexOf(values[i].value) !== -1) {
                        var entry = values[i].label;
                        aMulitPicklistLabels.push(entry);
                    }
                }

                return aMulitPicklistLabels.toString().replace(/,/g , ', ');
            }

            return sMulitPicklistLabels;
        }
    });

(function (angular) {
    'use strict';

    angular
        .module('oinio.core.pageLayoutRenderer')
        .service('PageLayoutService', function ($q, $log, SalesforceDataService, DescribeService, LocalDataService) {

            /**
             * generates the dynamic PageLayout
             *
             * @param {string} objectType
             * @param {number} sid
             * @param {boolean} isEdit
             * @returns {deferred.promise|{then, catch, finally}}
             */
            this.generatePageLayout = function (objectType, sid, isEdit) {
                var deferred = $q.defer();

                // load sobject from local smartstore
                LocalDataService.getSObject(objectType, sid).then(function (sobject) {

                    this.processPageLayoutGeneration(objectType, sobject, isEdit).then(function (pageLayoutResult) {
                        deferred.resolve({layout: pageLayoutResult.layout, sobject: pageLayoutResult.sobject});
                    }, function (error) {
                        deferred.reject(error);
                    });

                }.bind(this), function (error) {
                    deferred.reject(error);
                });

                return deferred.promise;
            };

            /**
             * generates the dynamic PageLayout for a given SObject
             *
             * @param {object} sobject
             * @param {boolean} isEdit
             * @returns {deferred.promise|{then, catch, finally}}
             */
            this.generatePageLayoutForSObject = function (sobject, isEdit) {
                var deferred = $q.defer();

                this.processPageLayoutGeneration(sobject.attributes.type, sobject, isEdit).then(function (pageLayoutResult) {
                    deferred.resolve({layout: pageLayoutResult.layout, sobject: pageLayoutResult.sobject});
                }, function (error) {
                    deferred.reject();
                });

                return deferred.promise;
            };

            /**
             * generates the dynamic PageLayout for a new record
             *
             * @param {string} objectType
             * @param {string} recordType
             * @returns {deferred.promise|{then, catch, finally}}
             */
            this.generatePageLayoutForNew = function (objectType, recordType) {

                var deferred = $q.defer();

                // create new sobject
                LocalDataService.createSObject(objectType, recordType).then(function (sobject) {
                    this.processPageLayoutGeneration(objectType, sobject, true).then(function (pageLayoutResult) {
                        deferred.resolve({layout: pageLayoutResult.layout, sobject: pageLayoutResult.sobject});
                    }, function (error) {
                        deferred.reject(error);
                    });
                }.bind(this), function (error) {
                    deferred.reject(error);
                });

                return deferred.promise;
            };

            /**
             *
             * @param {string} objectType
             * @param {object} sobject
             * @param {boolean} isEdit
             * * @returns {deferred.promise|{then, catch, finally}}
             */
            this.processPageLayoutGeneration = function (objectType, sobject, isEdit) {
                var deferred = $q.defer();

                var recordTypeId = sobject.RecordTypeId;
                DescribeService.getDescribeLayout(objectType, recordTypeId).then(function (describe) {

                    $log.debug('start generating layout for' + objectType + ' and RecordType: ' + recordTypeId);

                    var res;

                    if (isEdit) {
                        res = describe.layoutResult.editLayoutSections;
                    }
                    else {
                        res = describe.layoutResult.detailLayoutSections;
                    }

                    // filter fields not configured
                    for (var i = res.length - 1; i > -1; i--) {
                        var section = res[i];
                        var rowsDeleted = 0;
                        // loop over all sections...
                        for (var j = section.layoutRows.length - 1; j > -1; j--) {
                            var layoutRow = section.layoutRows[j];
                            var itemsDeleted = 0;
                            // loop over all rows...
                            for (var k = layoutRow.layoutItems.length - 1; k > -1; k--) {
                                var layoutItem = layoutRow.layoutItems[k];
                                if (layoutItem.type === 'EmptySpace') {
                                    continue;
                                }
                                // loop over all layoutItems
                                for (var l = layoutItem.layoutComponents.length - 1; l > -1; l--) {

                                    var layoutComponent = layoutItem.layoutComponents[l];

                                    // on EmptySpace do nothing
                                    if (layoutComponent.type === 'EmptySpace' || layoutComponent.type === 'Separator') {
                                        continue;
                                    }

                                    // field is not configured - so remove layout-item
                                    if (!sobject.hasOwnProperty(layoutComponent.value)) {
                                        layoutItem.type = 'EmptySpace';
                                        layoutItem.placeholder = true;
                                        //delete layoutItem.layoutComponents;
                                        delete layoutItem.required;
                                        delete layoutItem.editableForNew;
                                        delete layoutItem.editableForUpdate;
                                        itemsDeleted++;
                                        continue;
                                    }

                                    // reset variables
                                    layoutComponent = null;
                                }
                                // reset variables
                                layoutItem = null;
                            }
                            // if all items are deleted remove complete row too!
                            if (layoutRow.numItems === itemsDeleted) {
                                section.layoutRows.splice(j, 1);
                                rowsDeleted++;
                            }
                            // reset variables
                            layoutRow = null;
                        }
                        // if all rows in a section are removed remove section too!
                        if (rowsDeleted === section.rows) {
                            res.splice(i, 1);
                        }
                        // reset variables
                        section = null;
                        rowsDeleted = null;
                    }

                    deferred.resolve({layout: res, sobject: sobject});

                }, function (err) {
                    $log.debug('merge sobject with pagelayout error in PageLayoutService ' + JSON.stringify(err));
                    deferred.reject(err);
                });

                return deferred.promise;
            };
        });
})(angular);

'use strict';

angular.module('oinio.core.pageLayoutRenderer')
    .component('pageLayoutRenderer', {
        templateUrl: 'app/core/pagelayout/pagelayoutrenderer.component.html',
        bindings: {
            rendermode: '<',
            showHeader: '<',
            collapseSections: '<',
            sobject: '<',
            pageLayout: '<',
            readOnlyFields: '<'
        },
        controller: function () {
            var rendermode = 'view';
            var showHeader = true;
            var collapseSections = false;
            this.$onInit = function () {
                void 0;
            };
        },
        restrict: 'E',
        transclude: 'true',
        controllerAs: '$ctrl'
    });

(function (angular) {
    'use strict';

    /**
     * Module oinio.core ConfigurationService
     * It's responsibilities are creating framework soups based on json file,
     * and creating business soups based on _object (rely on LocalDateService).
     */
    angular.module('oinio.core')
        .service('ConfigurationService', function (APP_SETTINGS, $q, $http, $filter, LocalCacheService, DescribeService, LocalDataService, SMARTSTORE_COMMON_SETTING) {
            var service = this;

            var _configuredLayoutableObjectTypes = [];
            var _configuredObjectTypes = [];
            /**
             * soup settings for global soups
             * @returns {Promise}
             */
            service.globalSoupSettings = function () {
                void 0;

                var deferred = $q.defer();

                $http.get(APP_SETTINGS.GLOBAL_SOUP_CONFIGURATION_FILE).then(function (globalSoups) {
                    var soupSettings = buildSoupSettings(globalSoups.data);
                    deferred.resolve(soupSettings);
                }, function (error) {
                    deferred.reject(error);
                });

                return deferred.promise;
            };

            /**
             * soup settings for internal framework soups
             * @returns {Promise}
             */
            service.frameworkSoupSettings = function () {
                void 0;

                var deferred = $q.defer();

                $http.get(APP_SETTINGS.FRAMEWORK_SOUP_CONFIGURATION_FILE).then(function (frameworkSoups) {
                    var soupSettings = buildSoupSettings(frameworkSoups.data);
                    deferred.resolve(soupSettings);
                }, function (error) {
                    deferred.reject(error);
                });

                return deferred.promise;
            };

            /**
             * get all object types to synchronize form local static configuration or from online configuration
             * @returns {Promise}
             */
            service.objectTypesToSynchronize = function () {
                var deferred = $q.defer();
                var objectTypes = [];

                void 0;

                // load configuration from managed package (_configration and _object)
                LocalDataService.queryConfigurationAndObjects().then(function (configuration) {

                    // TODO: filter to exclude MobileVizArt__Active__c = false, or API name including Note, Attachment, Event and Task

                    var i = 0;
                    var parseConfiguration = function () {

                        // configuration objects is null, resolve [];
                        if (configuration.objects === undefined) {
                            deferred.resolve(objectTypes);
                            return;
                        }

                        if (i < configuration.objects.length) {
                            var configObj = configuration.objects[i];

                            // get objectType through parsing this object (_object)
                            service.parseObjectTypeFromMobileConfiguration(configObj).then(function (objectType) {
                                void 0;
                                objectTypes.push(objectType);

                                i++;
                                parseConfiguration();
                            }, function (error) {
                                deferred.reject(error);
                            });
                        } else {
                            void 0;
                            deferred.resolve(objectTypes);
                        }
                    };

                    parseConfiguration();
                }, function (error) {
                    deferred.reject(error);
                });

                return deferred.promise;
            };

            /**
             * get all configured object types. With parameter layoutable true, only layoutable object types are returned
             *
             * @param {boolean} layoutable
             * @returns {*|promise}
             */
            service.getConfiguredObjectTypes = function (layoutable) {
                var deferred = $q.defer();

                if(_configuredObjectTypes.length === 0){
                    // load describeObject types to determine configured object types
                    DescribeService.getDescribeSObjects(false).then(function (describeSObjects) {

                        var layoutableObjectTypes = [];
                        var objectTypes = [];

                        for(var i=0; i<describeSObjects.length; i++){
                            var describeSObject = describeSObjects[i];

                            // all object types wether they are layoutable or not
                            objectTypes.push(describeSObject.objectType);

                            // only layoutable object types
                            if(describeSObject.describe.layoutable){
                                layoutableObjectTypes.push(describeSObject.objectType);
                            }
                        }

                        // cache object types
                        _configuredLayoutableObjectTypes = layoutableObjectTypes;
                        _configuredObjectTypes = objectTypes;

                        if(layoutable){
                            // return only layoutable object types
                            deferred.resolve(_configuredLayoutableObjectTypes);
                        }
                        else{
                            // return all configured object types
                            deferred.resolve(_configuredObjectTypes);
                        }
                    }, function(error){
                        // in case of an error, just return an empty array to ensure not to impair the app
                        deferred.reject([]);
                    });
                }
                else{
                    if(layoutable){
                        // return only layoutable object types
                        deferred.resolve(_configuredLayoutableObjectTypes);
                    }
                    else{
                        // return all configured object types
                        deferred.resolve(_configuredObjectTypes);
                    }
                }

                return deferred.promise;
            };

            /**
             * parse object type from managed package(_object) and describe of this object,
             * add reference field path for smartStore creating index.
             *
             * @param {object} configObj (_object, MobileVizArt__Mobile_Object__c)
             * @returns {Promise}
             */
            service.parseObjectTypeFromMobileConfiguration = function (configObj) {
                var deferred = $q.defer();

                // get the describe of this business object
                DescribeService.getDescribeSObject(configObj.Name).then(function (describeResult) {

                    // get search fields for searching index of smartStore soup.
                    // Default adding Id(salesforce Id) field into it.
                    var indexSpec = [{
                        'path': 'Id',
                        'type': 'string'
                    }];

                    // TODO: User and Group also should sync down those fields according to configuration.
                    var skipConfigurationObjects = ['MobileVizArt__Mobile_Configuration__c', 'MobileVizArt__Mobile_Object__c', 'User', 'Group'];
                    var syncedFields = configObj['MobileVizArt__Fields__c'].replace(new RegExp(/\s/g), '').split(',');

                    // get all fields for sync.
                    var fields = [];
                    angular.forEach(describeResult.fields, function (fieldItem) {

                        // filter not necessary download fields of business objects which are exclude configuration objects
                        if (syncedFields.indexOf(fieldItem.name) !== -1 || skipConfigurationObjects.indexOf(configObj.Name) !== -1) {
                            fields.push(fieldItem.name);

                            // filter reference fields, then add these field + '_sid' as suffix for smartStore index path
                            if (fieldItem.type === 'reference') {

                                // Index for reference field
                                var referenceIndex = {
                                    'path': fieldItem.name,
                                    'type': 'string'
                                };

                                // Index for reference sid field
                                var referenceSidIndex = {
                                    'path': fieldItem.name + SMARTSTORE_COMMON_SETTING.REFERENCED_FIELD_EXTENSION_SUFFIX,
                                    'type': 'string'
                                };

                                // Index for reference type field
                                var referenceTypeIndex = {
                                    'path': fieldItem.name + SMARTSTORE_COMMON_SETTING.REFERENCED_FIELD_TYPE_SUFFIX,
                                    'type': 'string'
                                };

                                indexSpec.push(referenceIndex);
                                indexSpec.push(referenceSidIndex);
                                indexSpec.push(referenceTypeIndex);
                            } else {
                                var fieldSearchableByDefault = ['Name', 'Subject', 'IsDeleted', 'IsConverted'];
                                if (fieldSearchableByDefault.indexOf(fieldItem.name) !== -1) {
                                    var fieldSearchIndex = {
                                        'path': fieldItem.name,
                                        'type': 'string'
                                    };
                                    indexSpec.push(fieldSearchIndex);
                                }
                            }
                        }
                    });

                    // get smartStore index path from MobileVizArt__Search_Fields__c field
                    if (configObj['MobileVizArt__Search_Fields__c'] !== undefined && configObj['MobileVizArt__Search_Fields__c'] != null) {
                        angular.forEach(configObj['MobileVizArt__Search_Fields__c'].replace(new RegExp(/\s/g), '').split(','), function (searchField) {
                            indexSpec.push({
                                'path': searchField,
                                'type': 'string'
                            });
                        });
                    }

                    // if objectType is Attachment, add _bodySynced field for indexSpec
                    if (configObj.Name === 'Attachment') {
                        indexSpec.push({
                            'path': '_bodySynced',
                            'type': 'string'
                        });
                        indexSpec.push({
                            'path': '_bodySyncOnDemand',
                            'type': 'string'
                        });
                    } else if (configObj.Name === 'ContentVersion') {
                        indexSpec.push({
                            'path': 'IsLatest',
                            'type': 'string'
                        });
                        indexSpec.push({
                            'path': 'VersionNumber',
                            'type': 'string'
                        });
                        indexSpec.push({
                            'path': '_versionDataSynced',
                            'type': 'string'
                        });
                        indexSpec.push({
                            'path': '_versionDataSyncOnDemand',
                            'type': 'string'
                        });
                    }

                    var filterCriteria = configObj['MobileVizArt__Filter_Criteria__c'];
                    // parse special expression which is beginning and ending with '::'
                    if (filterCriteria && filterCriteria.indexOf('::') !== -1) {
                        var userInfo = LocalCacheService.get('currentUser');

                        var matches = filterCriteria.match(/(like\s+)?::\S+\.\S+::/gi);
                        angular.forEach(matches, function (replaceItem) {
                            var replaceObjBeginIndex = replaceItem.indexOf('::') + 2;
                            var dotIndex = replaceItem.indexOf('.');
                            var replaceObj = replaceItem.substring(replaceObjBeginIndex, dotIndex);
                            var replaceField = replaceItem.substring(dotIndex + 1, replaceItem.length - 2);
                            if (replaceObj.toLowerCase() === 'user') {

                                // parse the value of expression.
                                var replaceValue = userInfo[replaceField];

                                if (replaceValue === undefined || replaceValue == null) {
                                    console.log('FilterCriteria ' + replaceItem + ' cannot be parsed.');
                                } else {
                                    if (replaceItem.toLowerCase().indexOf('like') === 0) {

                                        // while like searching, default add % into begin position and end position of the value.
                                        replaceValue = 'LIKE \'%' + replaceValue + '%\'';
                                    } else {
                                        replaceValue = '\'' + replaceValue + '\'';
                                    }

                                    filterCriteria = filterCriteria.replace(replaceItem, replaceValue);
                                }
                            } else {
                                console.log('FilterCriteria ' + replaceItem + ' cannot be parsed.');
                            }
                        });
                    }

                    // TODO: need to add the field MobileVizArt__Skip_Cleanup__c into online package
                    var objectType = {
                        'name': configObj.Name,
                        'label': describeResult.label,
                        'fields': fields,
                        'filterCriteria': filterCriteria,
                        'lookupModStamp': configObj['MobileVizArt__Lookup_Mod_Stamp__c'],
                        'indexSpec': indexSpec,
                        'level': configObj['MobileVizArt__Level__c'],
                        '_soupEntryId': configObj['_soupEntryId'],
                        'needCleanUp': !configObj['MobileVizArt__Skip_Cleanup__c']
                    };

                    deferred.resolve(objectType);
                }, function (err) {
                    deferred.reject(err);
                });

                return deferred.promise;
            };

            /**
             * Get Mobile_Configuration__c and Mobile_Object__c configurtion
             * @returns {Promise}
             */
            service.mobileConfigurationToSynchronize = function () {
                var deferred = $q.defer();

                // Load configuration from managed package, _configration and _object
                void 0;

                $http.get(APP_SETTINGS.MOBILE_CONFIGURATION_FILE).then(function (objectTypesConfig) {

                    // Get mobile configuration object types
                    var objectTypes = objectTypesConfig.data;

                    var index = 0;

                    // For each configuration object, get fields from object describe
                    var loadEachObject = function (records) {
                        if (!records || records.length === index) {

                            void 0;
                            deferred.resolve(records);
                        } else {
                            var objectType = records[index];
                            index++;

                            // Get the object describe
                            DescribeService.loadDescribeSObject(objectType.name).then(function (describeResult) {

                                // Get all fields for sync
                                var fields = [];
                                angular.forEach(describeResult.fields, function (fieldItem) {
                                    fields.push(fieldItem.name);
                                });

                                // Populate original fields attribute of the configured type
                                objectType.fields = fields;

                                loadEachObject(records);
                            }, function (error) {
                                deferred.reject(error);
                            });
                        }
                    };

                    loadEachObject(objectTypes);
                }, function (error) {
                    deferred.reject(error);
                });

                return deferred.promise;
            };


            /**
             * get business object type according to object name
             *
             * @param {string} objectName
             * @returns {Promise}
             */
            service.getBusinessObjectTypeByName = function (objectName) {
                var deferred = $q.defer();

                var objectTypes = LocalCacheService.get('_businessObjectTypes');

                if (objectTypes) {
                    deferred.resolve(_.findWhere(objectTypes, {name: objectName}));
                } else {
                    service.objectTypesToSynchronize().then(function (objectTypes) {

                        // cache objectTypes
                        LocalCacheService.set('_businessObjectTypes', objectTypes);

                        deferred.resolve(_.findWhere(objectTypes, {name: objectName}));
                    }, function (error) {
                        deferred.reject(error);
                    });
                }

                return deferred.promise;
            };

            /**
             * soup settings for configured object types
             * @returns {Promise}
             */
            service.objectTypeSoupSettings = function () {
                var deferred = $q.defer();

                service.objectTypesToSynchronize().then(function (objectTypes) {
                    var soupSettings = buildSoupSettings(objectTypes);

                    deferred.resolve(soupSettings);
                }, function (error) {
                    deferred.reject(error);
                });

                return deferred.promise;
            };

            /**
             * build soup settings to register soups
             * @param {json} data
             * @returns {Array}
             */
            function buildSoupSettings(data) {
                var soupSettings = [];

                angular.forEach(data, function (objectType) {

                    // use targetSoup as soup name if this property exists
                    var soupName = (!objectType.targetSoup ? objectType.name : objectType.targetSoup);

                    var indexSpec = [];
                    angular.forEach(objectType.indexSpec, function (field) {
                        indexSpec.push({'path': field.path, 'type': field.type});
                    });

                    var soup = {
                        'name': soupName,
                        'objectTypeName': objectType.name,
                        'indexSpec': indexSpec,
                        'externalStorage': objectType.externalStorage
                    };

                    soupSettings.push(soup);
                });

                return soupSettings;
            }

        });
})(angular);

(function (angular) {
    'use strict';

    /**
     * Module oinio.core ConnectionMonitor
     */
    angular.module('oinio.core')
        .service('ConnectionMonitor', function ($rootScope, $cordovaNetwork, $log) {

            this.isOnline = function () {
                if (ionic.Platform.isWebView()) {
                    return $cordovaNetwork.isOnline();
                } else {
                    return navigator.onLine;
                }
            };

            this.isOffline = function () {
                if (ionic.Platform.isWebView()) {
                    return !$cordovaNetwork.isOnline();
                } else {
                    return !navigator.onLine;
                }
            };

            this.startWatching = function () {
                if (ionic.Platform.isWebView()) {

                    $rootScope.$on('$cordovaNetwork:online', function (event, networkState) {
                        $log.debug('>>>> went online');
                    });

                    $rootScope.$on('$cordovaNetwork:offline', function (event, networkState) {
                        $log.debug('>>>> went offline');
                    });
                }
                else {

                    window.addEventListener('online', function (e) {
                        $log.debug('>>>> went online');
                    });

                    window.addEventListener('offline', function (e) {
                        $log.debug('>>>> went offline');
                    });
                }
            };
        });
})(angular);

(function (angular, _) {
    'use strict';

    /**
     * @ngdoc service
     * @name oinio.core.service:DescribeService
     *
     * @description
     * TODO: description
     */
    angular.module('oinio.core')
        .service('DescribeService', function ($q, ForceClientService, MetaService, $log, $http, $cordovaFile, SMARTSTORE_COMMON_SETTING, UtilService, $timeout, LocalCacheService, Exception) {
            var service = this;
            var describeSObjectsCache;
            var describeTabsCache;
            var keyPrefixMapCache;
            var objectNameMapCache;
            var skipSyncDescribeLayoutObjects = ['ContentDocument', 'ContentVersion', 'ContentDocumentLink'];

            /**
             * @ngdoc method
             * @description
             * get describe SObject result for given objectType
             * if describe is not already available, the describe SObject result is fetched from Salesforce
             *
             * @param {string} objectType
             * @param {boolean} clearCache
             * @returns {Promise}
             */
            service.getDescribeSObject = function (objectType, clearCache) {
                var deferred = $q.defer();

                service.getDescribeSObjects(clearCache).then(function (describeSObjects) {
                    var describeSObject = _.findWhere(describeSObjects, {objectType: objectType});
                    if (describeSObject) {
                        deferred.resolve(describeSObject.describe);
                    } else {
                        deferred.reject('Error: DescribeSObject for ' + objectType + ' doesn\'t exist.');
                    }
                }, function (error) {
                    deferred.reject('Error in DescribeService - getDescribeSObject(): ' + error);
                });

                return deferred.promise;
            };

            /**
             * @ngdoc method
             * @description
             * query all describe SObject stored in smartStore
             *
             * @param {boolean} clearCache
             * @returns {Promise}
             */
            service.getDescribeSObjects = function (clearCache) {

                var deferred = $q.defer();

                // create querySpec
                var querySpec = navigator.smartstore.buildAllQuerySpec('objectType', null, SMARTSTORE_COMMON_SETTING.PAGE_SIZE_FOR_ALL);

                if (describeSObjectsCache && !clearCache) {
                    deferred.resolve(describeSObjectsCache);
                } else {

                    // query from soup
                    navigator.smartstore.querySoup('_describeSObject', querySpec, function (cursor) {

                        describeSObjectsCache = cursor.currentPageOrderedEntries;
                        deferred.resolve(describeSObjectsCache);
                    }, function (error) {
                        deferred.reject('Error in DescribeService - getDescribeSObjects(): ' + error);
                    });
                }

                return deferred.promise;
            };

            /**
             * @ngdoc method
             * @description
             * load DescribeSObject from Salesforce
             *
             * @param {string} objectType
             * @param {Boolean} [notCheckModified] not checking describe whether been modified
             * @returns {Promise}
             */
            service.loadDescribeSObject = function (objectType, notCheckModified) {

                var deferred = $q.defer();
                var forceClient = ForceClientService.getForceClient();
                var describeSObjectResult = [];

                // Get last check describe date from local database
                MetaService.getObjectMetaByType(objectType).then(function (objMeta) {

                    var lastCheckDescribeDate = null;
                    if (objMeta && objMeta.lastCheckDescribeDate) {
                        lastCheckDescribeDate = objMeta.lastCheckDescribeDate;
                    }

                    var headerParam = {};
                    /* If-Modified-Since causes problems. Sometimes Salesforce returns a 304 if If-Modified-Since param is set
                     if (objectType.indexOf('__c') > -1 && !notCheckModified) {

                     // Only check If-Modified-Since for custom object,
                     // because for standard object and standard fields of the standard object, if their labels are changed to a new value and
                     // then changed back to the default value, the changing back won't be considered as a change,
                     // e.g.:
                     // 1. Account's label is changed from default "Account" to "Account 2" at 1:00, and REST would return "Account 2" with last modified at 1:00.
                     // 2. Call REST with header If-Modified-Since: 1:00, it returns 304 no modified.
                     // 3. Change Account's label from "Account 2" to "Account 3" at 1:05, and call REST again with header If-Modified-Since: 1:00, it returns "Account 3"
                     // with last modified at 1:05.
                     // 4. Call REST with header If-Modified-Since: 1:05, it returns 304 no modified.
                     // 5. Change Account's label from "Account 3" to "Account" (default label), and call REST again with header If-Modified-Since: 1:05, it doesn't return "Account",
                     // but 304 no modified.
                     headerParam['If-Modified-Since'] = lastCheckDescribeDate;
                     }*/

                    // query describe SObject from salesforce
                    forceClient.describeWithHeader(objectType, function (describeResult) {

                        if (describeResult) {

                            // There is a change after last call for the describe
                            var newCheckDate = arguments[2].getResponseHeader('Date');
                            var lastModifiedDate = arguments[2].getResponseHeader('Last-Modified');

                            describeSObjectResult.push({
                                objectType: objectType,
                                describe: describeResult
                            });

                            // store describe SObject in smartStore
                            navigator.smartstore.upsertSoupEntriesWithExternalId(false, '_describeSObject', describeSObjectResult, 'objectType', function () {

                                // Update last check describe date to local database
                                MetaService.updateLastCheckDescribeDate(objectType, newCheckDate).then(function () {

                                    var updateLanguage = true;
                                    if (objectType.indexOf('__c') > -1 && !notCheckModified && lastModifiedDate && lastCheckDescribeDate) {
                                        var lastModified = new Date(lastModifiedDate);
                                        var lastCheck = new Date(lastCheckDescribeDate);

                                        if (lastModified <= lastCheck) {
                                            updateLanguage = false;
                                        }
                                    }

                                    if (updateLanguage) {
                                        // update i18n data of this object
                                        updateI18NData(describeResult).then(function () {
                                            deferred.resolve(describeResult);
                                        }, function (error) {
                                            deferred.reject(error);
                                        });
                                    }
                                    else {
                                        deferred.resolve(describeResult);
                                    }
                                }, function (error) {
                                    deferred.reject(error);
                                });

                            }, function (error) {
                                deferred.reject(error);
                            });
                        } else {

                            // There is no change after last call for the describe
                            // get describe sobject result for given objectType from smartStore
                            var querySpec = navigator.smartstore.buildExactQuerySpec('objectType', objectType);
                            navigator.smartstore.querySoup('_describeSObject', querySpec, function (cursor) {

                                var describes = cursor.currentPageOrderedEntries;

                                if (describes && describes.length > 0 && describes[0] != null && describes[0].describe != null) {
                                    deferred.resolve(describes[0].describe);
                                } else {
                                    deferred.reject('>>>> getDescribeSObject failed');
                                }
                            }, function (error) {
                                deferred.reject(error);
                            });
                        }
                    }, function (error) {
                        $log.warn(new Exception(null, error.status, error.message, error.stack, error));
                        deferred.reject(error);
                    }, headerParam);
                }, function (error) {
                    deferred.reject(error);
                });

                return deferred.promise;
            };

            /**
             * @ngdoc method
             * @description
             * load DescribeSObjects from Salesforce
             *
             * @param {Array} objectTypes object type names array
             * @param {Boolean} [notCheckModified] not checking describe whether been modified
             * @returns {Promise}
             */
            service.loadDescribeSObjects = function (objectTypes, notCheckModified) {

                var deferred = $q.defer();
                var describeSObjectResults = [];

                var loadEachObject = function (objectTypes) {
                    if (!objectTypes || objectTypes.length === 0) {
                        deferred.resolve(describeSObjectResults);
                    } else {
                        console.log('current object type:::', objectTypes);
                        console.log('current time:::', new Date());

                        // Process each object type
                        service.loadDescribeSObject(objectTypes.pop(), notCheckModified).then(function (describeResult) {
                            console.log('current result:::', describeResult);
                            describeSObjectResults.push(describeResult);
                            loadEachObject(objectTypes);
                        }, function (error) {
                            deferred.reject(error);
                        });
                    }
                };

                loadEachObject(objectTypes);

                return deferred.promise;
            };

            /**
             * @ngdoc method
             * @description
             * load DescribeLayout from Salesforce
             *
             * @param {string} objectType
             * @param {Array} recordTypeInfos
             * @returns {Promise}
             */
            service.loadDescribeLayout = function (objectType, recordTypeInfos) {

                var deferred = $q.defer();
                var promises = [];

                var forceClient = ForceClientService.getForceClient();

                var describeLayoutResult = {
                    objectType: objectType,
                    describeLayouts: []
                };

                //console.log('INFO ', recordTypeInfos);

                // if this SObject have layouts, but haven't record type id, then add dummy Master record type.
                if (recordTypeInfos && recordTypeInfos.length === 0) {

                    recordTypeInfos.push({
                        'available': true,
                        'defaultRecordTypeMapping': true,
                        'master': true,
                        'name': 'Master',
                        'recordTypeId': '012000000000000AAA'
                    });
                }

                // iteration every record type of this SObject
                angular.forEach(recordTypeInfos, function (recordTypeInfo) {

                    // remove not available recordType
                    // 2016-07-28 JSI: we have to synchronize all RT's to display all records correctly. available == false means here,
                    // the user is not allowed to create records with this RT. So we have to check for the availability during
                    // the record type selection while creating a new record
                    /*if (recordTypeInfo.available === false) {
                     return;
                     }*/

                    // query describe layout
                    var promise = forceClient.describeLayout(objectType, recordTypeInfo.recordTypeId, function (layoutResult) {

                        describeLayoutResult.describeLayouts.push({
                            'defaultRecordTypeMapping': recordTypeInfo.defaultRecordTypeMapping,
                            'master': recordTypeInfo.master,
                            'name': recordTypeInfo.name,
                            'recordTypeId': recordTypeInfo.recordTypeId,
                            'layoutResult': layoutResult
                        });

                    });

                    promises.push(promise);
                });

                $q.all(promises).then(function () {

                    // store describe layout in smartStore
                    navigator.smartstore.upsertSoupEntriesWithExternalId(false, '_describeLayout', [describeLayoutResult], 'objectType', function () {
                        deferred.resolve(describeLayoutResult);
                    }, function (error) {
                        deferred.reject(error);
                    });
                }, function (error) {
                    $log.warn(new Exception(null, error.status, error.message, error.stack, error));
                    deferred.reject(error);
                });

                return deferred.promise;
            };

            /**
             * @ngdoc method
             * @description
             * load DescribeLayouts from Salesforce
             *
             * @param {Array} describeSObjectResult object type names array
             * @returns {Promise}
             */
            service.loadDescribeLayouts = function (describeSObjectResult) {

                var deferred = $q.defer();
                var promises = [];

                // Process each object type which is layoutable
                angular.forEach(describeSObjectResult, function (describeSObject) {

                    if (skipSyncDescribeLayoutObjects.indexOf(describeSObject.name) === -1 && describeSObject['customSetting'] === false) {

                        if (describeSObject['layoutable'] === false) {
                            $log.debug('>>>> ' + describeSObject.name + ' is not layoutable');
                            return;
                        }

                        // TODO: remove - this is just for errorhandling testing
                        //if (describeSObject.name === 'Account')
                        //    promises.push(service.loadDescribeLayout(describeSObject.name + '_gibtesnicht'));
                        //else
                        //promises.push(service.loadDescribeLayout(describeSObject.name));

                        promises.push(service.loadDescribeLayout(describeSObject.name, describeSObject.recordTypeInfos));
                    }
                });

                $q.all(promises).then(function (result) {
                    deferred.resolve(result);
                }, function (error) {
                    deferred.reject(error);
                });

                return deferred.promise;
            };

            /**
             * @ngdoc method
             * @description
             * get describeLayout form local smartstore
             *
             * @param {string} objectType
             * @param {string} recordTypeId
             * @returns {Promise}
             */
            service.getDescribeLayout = function (objectType, recordTypeId) {

                var deferred = $q.defer();

                // create querySpec
                var querySpec = navigator.smartstore.buildExactQuerySpec('objectType', objectType);

                // query soup
                navigator.smartstore.querySoup('_describeLayout', querySpec, function (cursor) {
                        for (var i = 0; i < cursor.currentPageOrderedEntries.length; i++) {
                            var describeLayoutResult = cursor.currentPageOrderedEntries[i];

                            for (var j = 0; j < describeLayoutResult.describeLayouts.length; j++) {
                                var describeLayout = describeLayoutResult.describeLayouts[j];

                                if (describeLayout.recordTypeId === recordTypeId || (recordTypeId == null && describeLayout.name === 'Master')) {
                                    deferred.resolve(describeLayout);
                                    break;
                                }
                            }
                        }
                    },
                    function (error) {
                        deferred.reject(error);
                    }
                );

                return deferred.promise;
            };

            /**
             * @ngdoc method
             * @description
             * get SObject writable fields
             *
             * @param {string} objectType
             * @returns {Promise}
             */
            service.getSObjectWritableFields = function (objectType) {
                var deferred = $q.defer();
                var writableFields = [];

                // get the describe of this business object
                service.getDescribeSObject(objectType).then(function (describeResult) {

                    angular.forEach(describeResult.fields, function (fieldItem) {

                        // filter writable fields
                        if (fieldItem.createable || fieldItem.updateable) {
                            writableFields.push(fieldItem.name);
                        }
                    });

                    deferred.resolve(writableFields);
                }, function (err) {
                    deferred.reject(err);
                });

                return deferred.promise;
            };

            /**
             * @ngdoc method
             * @description
             * Update i18n data of the object and fields label according to its describe
             *
             * @param {Object} describeResult
             * @returns {Promise}
             */
            var updateI18NData = function (describeResult) {
                var deferred = $q.defer();

                var currentUser = LocalCacheService.get('currentUser');
                var languageLocaleKey = currentUser['LanguageLocaleKey'];

                var i18nDir = 'i18n';
                //var i18nFilePath = i18nDir + '/locale-objects-' + languageLocaleKey + '.json';
                var i18nFilePath = i18nDir + '/locale-objects-en.json';

                void 0;

                var objectType = describeResult.name;
                var objectI18NData = {
                    label: describeResult.label,
                    labelPlural: describeResult.labelPlural
                };

                angular.forEach(describeResult.fields, function (fieldItem) {
                    objectI18NData[fieldItem.name] = fieldItem.label;
                });

                // Load i18n file content from old file
                loadI18NData(i18nFilePath).then(function (i18nFileContent) {
                    i18nFileContent[objectType] = objectI18NData;

                    // TODO: test for android
                    // Write json data into local i18n file.
                    // should use dataDirectory instead of applicationDirectory as applicationDirectory is read-only, and a custom loader is needed as well
                    checkAndCreateDir(cordova.file.dataDirectory, i18nDir).then(function () {

                        // write to file
                        $cordovaFile.writeFile(cordova.file.dataDirectory, i18nFilePath, JSON.stringify(i18nFileContent), true).then(function (success) {
                            void 0; // + ' jsonData:' + JSON.stringify(i18nFileContent));

                            deferred.resolve(success);
                        }, function (error) {

                            // TODO:
                            void 0;
                            deferred.reject(error);
                        });
                    }, function (error) {

                        // TODO:
                        void 0;
                        deferred.reject(error);
                    });
                }, function (error) {
                    deferred.reject(error);
                });

                return deferred.promise;
            };

            /**
             * @ngdoc method
             * @description
             * Check and create directory
             *
             * @param   {FileSystem} fileSystem
             * @param   {string} dirName
             * @returns {Promise}
             */
            var checkAndCreateDir = function (fileSystem, dirName) {

                var deferred = $q.defer();

                $cordovaFile.checkDir(fileSystem, dirName).then(function (success) {

                    // dir is existing
                    void 0;
                    deferred.resolve();
                }, function (err) {

                    // dir is not existing and create
                    void 0;
                    $cordovaFile.createDir(fileSystem, dirName).then(function () {
                        deferred.resolve();
                    }, function (err) {
                        deferred.reject(err);
                    });
                });

                return deferred.promise;
            };

            /**
             * @ngdoc method
             * @description
             * Load i18n data from local objects i18n file, if not exist this file return {}.
             *
             * @param {string} i18nFilePath
             * @returns {Promise}
             */
            var loadI18NData = function (i18nFilePath) {
                var deferred = $q.defer();

                $cordovaFile.readAsText(cordova.file.dataDirectory, i18nFilePath).then(function (success) {
                    deferred.resolve(JSON.parse(success));
                }, function (error) {
                    deferred.resolve({});
                });

                return deferred.promise;
            };

            /**
             * Get fields information of an object from its describe layout according to special record type id.
             * Config fieldName return this special field info which is an object,
             * otherwise return an array of all the object fields info.
             *
             * @param {object} filterInfo its property as belows:
             *  {string} objectName object name
             *  {string} [fieldName] field name, optional, if setting return special field info
             *  {string} [recordTypeId] record type id, optional
             * @returns {promise}
             */
            service.getFieldsInfoFromLayout = function (filterInfo) {

                var deferred = $q.defer();

                var querySpec = navigator.smartstore.buildExactQuerySpec('objectType', filterInfo.objectName, 1);

                navigator.smartstore.querySoup(false, '_describeLayout', querySpec, function (cursor) {
                    var result = (cursor && cursor.currentPageOrderedEntries && cursor.currentPageOrderedEntries.length) ? cursor.currentPageOrderedEntries[0] : null;

                    var fieldsInfo;

                    if (result) {
                        var describeLayoutItem;
                        if (filterInfo.recordTypeId) {
                            describeLayoutItem = _.findWhere(result.describeLayouts, {recordTypeId: filterInfo.recordTypeId});
                        } else {
                            describeLayoutItem = _.findWhere(result.describeLayouts, {defaultRecordTypeMapping: true});
                            filterInfo.recordTypeId = describeLayoutItem.recordTypeId;
                        }

                        if (describeLayoutItem) {
                            fieldsInfo = getFieldsInfo(describeLayoutItem.layoutResult, filterInfo.fieldName);
                        }
                    }

                    deferred.resolve(fieldsInfo);
                }, function (error) {
                    deferred.reject(error);
                });

                return deferred.promise;
            };

            /**
             * get fields information from the sobject describe layout of special record type
             *
             * @param {object} layoutResult
             * @param {string} [fieldName] field name, optional, if setting return special field info
             * @returns {*}
             */
            function getFieldsInfo(layoutResult, fieldName) {

                var layoutRows = _.reduceRight(layoutResult['editLayoutSections'], function (a, b) {
                    return a.concat(b['layoutRows']);
                }, []);

                var layoutItems = _.reduceRight(layoutRows, function (a, b) {
                    return a.concat(b['layoutItems']);
                }, []);

                var layoutComponents = _.reduceRight(layoutItems, function (a, b) {
                    return a.concat(b['layoutComponents']);
                }, []);

                var details = _.reduceRight(layoutComponents, function (a, b) {
                    return a.concat(b['details']);
                }, []);

                if (fieldName) {
                    return _.findWhere(details, {name: fieldName});
                } else {
                    return details;
                }
            }

            /**
             * @ngdoc method
             * @description
             * Get special object type's tab icon path in lightning design system icon asset.
             * Such as: lib/salesforce-lightning-design-system/assets/icons/standard-sprite/svg/symbols.svg#Account
             * If using custom file uploaded by user, then return iconUrl in tab information
             * such as: https://*.content.force.com/servlet/servlet.ImageServer?id=*&oid=*&lastMod=*
             *
             * @param {string} objectType
             * @returns {Promise}
             */
            service.getTabIconPathInAsset = function (objectType) {
                var deferred = $q.defer();

                var iconRootPath = 'lib/salesforce-lightning-design-system/assets/icons/';

                service.getDescribeTabs().then(function (describeTabs) {

                    var iconPath;

                    // filter to get special object type tab information
                    var tabInfo = _.findWhere(describeTabs, {"sobjectName": objectType});
                    if (tabInfo) {
                        var svgInfo = _.findWhere(tabInfo.icons, {"contentType": "image/svg+xml"});

                        if (svgInfo) {

                            // url like as 'http://na1.salesforce.com/img/icon/t4/standard/account.svg'
                            var svgUrl = svgInfo['url'];
                            if (svgUrl) {

                                // parse tabs svg url info and match it with lightning design system icon asset path
                                var needInfo = new RegExp('\\w+/\\w+.svg$').exec(svgUrl);
                                if (needInfo) {
                                    var needInfoArr = ('' + needInfo).split('\/');
                                    iconPath = iconRootPath + needInfoArr[0] + '-sprite/svg/symbols.svg#'
                                        + needInfoArr[1].substring(0, needInfoArr[1].length - 4);
                                }
                            }
                        }
                    }

                    if (iconPath) {
                        deferred.resolve({path: iconPath, srcType: 'svg'});
                    } else {
                        if (tabInfo) {
                            deferred.resolve({path: tabInfo['iconUrl'], srcType: 'http'});
                        } else {
                            deferred.reject('Failed to get tab icon path in lightning design system svg');
                        }
                    }
                }, function (error) {
                    deferred.reject('Error in DescribeService - getTabIconPathInAsset(): ' + error);
                });

                return deferred.promise;
            };

            var alreadyLoadDescribeTabs = false;

            /**
             * @ngdoc method
             * @description
             * Get describe tabs information from the cache, if no cache reload it.
             *
             * @param {string} [times] optional, only for iteration self call, not necessary in out call function.
             *                                   Sign the times of waiting for loading describe tabs,
             * @returns {Promise}
             */
            service.getDescribeTabs = function (times) {
                var deferred = $q.defer();

                if (alreadyLoadDescribeTabs) {
                    if (describeTabsCache) {
                        deferred.resolve(describeTabsCache);
                    } else {

                        // get the cache after finished loading describe tabs
                        $timeout(function () {
                            if (describeTabsCache) {
                                deferred.resolve(describeTabsCache);
                            } else {
                                times = times ? times : 0;

                                // try 10 times for loading data from cache after an interval waiting time
                                if (times < 10) {
                                    service.getDescribeTabs(times + 1);
                                } else {
                                    deferred.reject('Failed to load describe tabs info exceed the timeout.');
                                }
                            }
                        }, 3000);
                    }
                } else {
                    alreadyLoadDescribeTabs = true;

                    loadDescribeTabs().then(function (describeTabs) {
                        describeTabsCache = describeTabs;
                        deferred.resolve(describeTabsCache);
                    }, function (error) {

                        void 0;
                        deferred.reject('Error in DescribeService - getDescribeTabs(): ' + error);
                    });
                }

                return deferred.promise;
            };

            /**
             * @ngdoc method
             * @description
             * Load describe tabs information.
             * If online fetch the data from salesforce, and store it in meta.
             * If offline load the data from smartStore in local.
             *
             * @returns {Promise}
             */
            var loadDescribeTabs = function () {
                var deferred = $q.defer();

                UtilService.isDeviceOnline().then(function (online) {
                    if (online === true) {
                        var forceClient = ForceClientService.getForceClient();

                        // query describe tabs info
                        forceClient.describeTabs(function (describeTabs) {

                            // store tabs info in smartStore
                            MetaService.setMetaValue('_describeTabs', describeTabs);
                            deferred.resolve(describeTabs);
                        }, function (error) {
                            $log.warn(new Exception(null, error.status, error.message, error.stack, error));
                            deferred.reject('Failed to load describe tabs info from salesforce: ' + error);
                        });
                    } else {

                        // load describe tabs info from local smartStore when offline
                        var describeTabs = MetaService.getMetaValue('_describeTabs');

                        if (describeTabs !== null) {
                            deferred.resolve(describeTabs);
                        } else {
                            deferred.reject('Failed to load describe tabs info from meta');
                        }
                    }
                }, function (error) {
                    deferred.reject(error);
                });

                return deferred.promise;
            };

            /**
             * @ngdoc method
             * @description
             * get the key prefix of SObject
             *
             * @param {string} objectType
             * @returns {Promise}
             */
            service.getKeyPrefix = function (objectType) {
                var deferred = $q.defer();

                if (keyPrefixMapCache) {
                    deferred.resolve(keyPrefixMapCache[objectType]);
                } else {
                    var keyPrefixMap = {};

                    // get the describe of business object
                    service.getDescribeSObjects(false).then(function (describeSObjects) {

                        for (var i = 0; i < describeSObjects.length; i++) {
                            var describe = describeSObjects[i]['describe'];

                            keyPrefixMap[describe.name] = describe['keyPrefix'];
                        }

                        keyPrefixMapCache = keyPrefixMap;
                        deferred.resolve(keyPrefixMap[objectType]);
                    }, function (err) {
                        deferred.reject(err);
                    });
                }

                return deferred.promise;
            };

            /**
             * @ngdoc method
             * @description
             * get SObject name by the key prefix
             *
             * @param {string} keyPrefix the salesforce id of SObject record, or key prefix of SObject
             * @returns {Promise}
             */
            service.getObjectNameByKeyPrefix = function (keyPrefix) {
                keyPrefix = keyPrefix.substr(0, 3);

                var deferred = $q.defer();

                if (objectNameMapCache) {
                    deferred.resolve(objectNameMapCache[keyPrefix]);
                } else {
                    var objectNameMap = {};

                    // get the describe of business object
                    service.getDescribeSObjects(false).then(function (describeSObjects) {

                        for (var i = 0; i < describeSObjects.length; i++) {
                            var describe = describeSObjects[i]['describe'];

                            objectNameMap[describe['keyPrefix']] = describe.name;
                        }

                        objectNameMapCache = objectNameMap;
                        deferred.resolve(objectNameMap[keyPrefix]);
                    }, function (err) {
                        deferred.reject(err);
                    });
                }

                return deferred.promise;
            };
        });
})(angular, _);

(function (angular, _) {
    'use strict';

    /**
     * Module oinio.core.service:FileService
     */
    angular.module('oinio.core')
        .service('initializeUserFolders', function ($q, $filter, $cordovaFile, $log, APP_SETTINGS, UtilService, LocalCacheService, LOG_SETTING, $cordovaEmailComposer, Logger, $injector, $timeout) {
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
                        void 0;
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
                    void 0;
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
                                void 0;
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
                        void 0;
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
                                    void 0;
                                    deferred.resolve();
                                });
                            }, function () {
                                // not available
                                deferred.reject({message: 'Send log failed, maybe you haven\'t setting one email account at least in your device.'});
                            });
                        })
                        .catch(function (error) {
                            void 0;
                            deferred.reject(error);
                        })
                        .finally(function () {
                            void 0;
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
                            return SalesforceDataService.addFileShareMemberByGroupName(fileId, 'C', LOG_SETTING.DEFAULT_LOG_FOLDER);
                        })
                        .then(function () {
                            return listDir(logFileFolder, 'F', true);
                        })
                        .then(function (logFileNames) {
                            void 0;
                            return removeFiles(logFileFolder, logFileNames);
                        })
                        .then(function () {
                            deferred.resolve();
                        })
                        .catch(function (error) {
                            void 0;
                            deferred.reject(error);
                        })
                        .finally(function () {
                            void 0;
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
        });
})(angular, _);

(function (angular) {
    'use strict';

    /**
     * Module oinio.core ForceClientService
     */
    angular.module('oinio.core')
        .service('ForceClientService', function () {
            var service = this, forceClient;

            service.setForceClient = function (instance) {
                forceClient = instance;
            };

            service.getForceClient = function () {
                return forceClient;
            };
        });
})(angular);

(function (angular) {
    'use strict';

    /**
     * Module oinio.core LightningOutService
     */
    angular.module('oinio.core')
        .service('LightningOutService', function ($q, $http, ForceClientService, angularLoad, ConnectionMonitor, SalesforceLoginService) {
            var service = this;

            /**
             * Create lighting components via Lighting Out approach.
             * This method only works when the device is online and connected to the org.
             * Currently, as $Lightning doesn't expose callbacks for error handling, so the method would be silent if there is any error during creation online.
             *
             * @param {string} appName - The name of your Lightning dependency app, including the namespace. For example, "c:LtngOiniooneApp".
             * @param {string} componentName - The name of the Lightning component to add to the page, including the namespace. For example, "c:LtngCalendarCmp".
             * @param {object} attributes - The attributes to set on the component when it’s created. For example, { name: theName, amount: theAmount }. 
             *                                If the component doesn’t require any attributes, pass in an empty object, { }.
             * @param {element or string} domLocator - The DOM element or element ID that indicates where on the page to insert the created component.
             *
             * @returns {promise} the created cmp in promise or error message when fails
             */
            service.createComponent = function (appName, componentName, attributes, domLocator) {

                var deferred = $q.defer();

                if (!ConnectionMonitor.isOnline()) {
                    deferred.reject("Cannot connect to the internet, Lightning Component only works for when device is online.");
                    return deferred.promise;
                }

                SalesforceLoginService.webLogin().then(function () {
                    var lightningEndPointURI = ForceClientService.getForceClient().instanceUrl.split(".")[0] + ".lightning.force.com";
                    var sessionToken = ForceClientService.getForceClient().sessionId;
                    void 0;
                    void 0;

                    if (window.$Lightning !== undefined) {

                        // $Lightning is already initialized, create lightning component
                        _createComponent($Lightning, appName, componentName, attributes, domLocator, lightningEndPointURI, sessionToken, function (cmp) {
                            deferred.resolve(cmp);
                        }, function (err) {
                            deferred.reject(err);
                        });
                    } else {
                        
                        // construct the lightning.out.js url
                        var lightningOutScriptUrl = ForceClientService.getForceClient().instanceUrl + "/lightning/lightning.out.js";
                        void 0;

                        // load lightning.out.js
                        // NOTE: so far, lightning.out.js only works when loading it from the org, but doesn't work if load it from local copy
                        angularLoad.loadScript(lightningOutScriptUrl).then(function () {
                            
                            // script loaded succesfully.
                            void 0;
                            
                            // create lightning component
                            _createComponent($Lightning, appName, componentName, attributes, domLocator, lightningEndPointURI, sessionToken, function (cmp) {
                                deferred.resolve(cmp);
                            }, function (err) {
                                deferred.reject(err);
                            });
                        }).catch(function() {
                            
                            // There was some error loading the script. Meh
                            void 0;
                            deferred.reject("failed to load lightning.out.js from " + lightningOutScriptUrl);
                        });
                    }
                }, function (err) {
                    void 0;
                    deferred.reject(err);
                });

                return deferred.promise;
            };

            var _createComponent = function ($Lightning, appName, componentName, attributes, domLocator, lightningEndPointURI, sessionToken, success, error) {
                try {

                    // TODO: Curretnly $Lightning doesn't expose error callbacks, 
                    // we shoudld make sure the error handling work once they are exposed.
                    $Lightning.use(appName, function () {
                        $Lightning.createComponent(componentName, attributes, domLocator, function (cmp) {
                            if (success) success(cmp);
                        });
                    }, lightningEndPointURI, sessionToken);
                } catch (err) {
                    if (error) error("failed to create component: " + JSON.stringify(err));
                }
            }

        });
})(angular);

(function (angular) {
    'use strict';

    /**
     * Mobule oinio.core LocalCacheService
     */
    angular.module('oinio.core')
        .service('LocalCacheService', function () {
            var service = this;

            service.data = {
                description: 'This object is cache! Don\'t delete this description!'
            };

            /**
             * set value in cache
             * @param {string} key
             * @param {object} value
             */
            service.set = function (key, value) {
                if (key === undefined) {
                    void 0;
                } else {
                    if (value === undefined) {
                        service.data[key] = {};
                    } else {
                        service.data[key] = value;
                    }
                }
            };

            /**
             * get key value from cache
             * @param {string} key
             * @returns {*}
             */
            service.get = function (key) {
                if (key !== undefined) {
                    return service.data[key];
                } else {
                    void 0;
                }
            };

            /**
             * delete key value from cache
             * @param {string} key
             * @returns {boolean}
             */
            service.del = function (key) {
                if (key === 'description' || key === undefined) {
                    return false;
                } else {
                    delete service.data[key];
                }
            };

            /**
             * empty complete cache
             */
            service.empty = function () {
                service.data = {
                    description: 'This object is cache! don\'t delete this description!!!'
                };
            };

            /**
             * get complete cache
             * @returns {{description: string}|*}
             */
            service.all = function () {
                return service.data;
            };
        });
})(angular);

(function (angular, _) {
    'use strict';

    /**
     * @ngdoc service
     * @name oinio.core.service:LocalDataService
     *
     * @description
     * TODO: description
     */
    angular.module('oinio.core')
        .service('LocalDataService', function ($q, $http, $filter, $log, SMARTSTORE_COMMON_SETTING, APP_SETTINGS, LocalCacheService, PicklistService, DescribeService, ConnectionMonitor, FileService, MetaService, UtilService, $injector) {
            var service = this;

            var Exception = $injector.get('Exception');
            var EXCEPTION_SEVERITY = $injector.get('EXCEPTION_SEVERITY');
            var PROCESS_CODE = $injector.get('PROCESS_CODE');
            var STATUS_CODE = $injector.get('STATUS_CODE');

            // field Informations Cache entity
            var fieldInformationsCache = {};

            // cache current user
            var _user;

            // cache configuration all objects
            var _configurationObjects;

            var skipCreateSObjects = ['ContentDocument'];
            var skipUpdateSObjects = [];
            var skipDeleteSObjects = ['ContentVersion'];

            /**
             * Get current user in cache or User soup if not cached.
             * @returns {*}
             * @private
             */
            var _getCurrentUser = function () {
                return $q(function (resolve, reject) {
                    if (_user) {
                        resolve(_user);
                    } else {
                        var currentUser = LocalCacheService.get('currentUser');
                        service.getEntryByExactMatch('User', 'Id', currentUser.Id).then(function (user) {
                            _user = user;
                            resolve(_user);
                        }, reject);
                    }
                });
            };

            /**
             * Get current user in cache or User soup if not cached.
             *
             * @param {string} objectName - the object api name
             * @param {string} recordTypeDeveloperName - the record type developer name
             *
             * @returns {promise} local record type entity in promise
             */
            var _getRecordTypeByDeveloperName = function (objectName, recordTypeDeveloperName) {
                return $q(function (resolve, reject) {
                    if (!objectName) {
                        reject('LocalDataService._getRecordTypeByDeveloperName Error: missing parameters.');
                    } else {
                        var smartstoreSmartQueryHandler = function (objectName, queryPath, queryByValue) {
                            var deferred = $q.defer();
                            var sql = 'select {RecordType:_soup} from {RecordType}';
                            sql += ' where {RecordType:SobjectType} = \'' + objectName + '\' and {RecordType:' + queryPath + '} = \'' + queryByValue + '\'';
                            var querySpec = navigator.smartstore.buildSmartQuerySpec(sql, 1);
                            navigator.smartstore.runSmartQuery(querySpec, function (cursor) {
                                var result = null;
                                void 0;
                                if (cursor && cursor.currentPageOrderedEntries && cursor.currentPageOrderedEntries.length) {
                                    result = cursor.currentPageOrderedEntries[0][0];
                                }

                                deferred.resolve(result);
                            }, function (err) {
                                deferred.reject('LocalDataService._getRecordTypeByDeveloperName query record type error: ' + JSON.stringify(err));
                            });

                            return deferred.promise;
                        };

                        // get object default record type from object describe result
                        if (!recordTypeDeveloperName) {
                            DescribeService.getDescribeSObject(objectName).then(function (objectDescribeResult) {
                                if (objectDescribeResult && objectDescribeResult.recordTypeInfos && objectDescribeResult.recordTypeInfos.length) {
                                    var defaultRecordTypeId = _.findWhere(objectDescribeResult.recordTypeInfos, {defaultRecordTypeMapping: true}).recordTypeId;
                                    smartstoreSmartQueryHandler(objectName, 'Id', defaultRecordTypeId).then(resolve, reject);
                                } else {
                                    resolve(null);
                                }
                            }, function (err) {
                                if (err) {
                                    void 0;
                                    resolve(null);
                                }
                            });
                        } else {
                            smartstoreSmartQueryHandler(objectName, 'DeveloperName', recordTypeDeveloperName).then(resolve, reject);
                        }
                    }
                });
            };

            /**
             * @description create sobject record locally
             *
             * @param {string} objectType - the objectType which should be created a record for
             * @param {string} [recordType] - the RecordType developer name of the new record - optional
             *
             * @returns the complete newly created sobject
             **/
            service.createSObject = function (objectType, recordType) {
                return $q(function (resolve, reject) {
                    if (!objectType) {
                        return reject('Invalid parameters: objectType is missing.');
                    }

                    var newSObjectRecord = {};

                    // load current user Information
                    _getCurrentUser().then(function (currentUser) {
                        if (currentUser) {
                            // resolve default sobject record type
                            _getRecordTypeByDeveloperName(objectType, recordType).then(function (recordTypeEntry) {
                                var recordTypeDeveloperName = '';
                                if (recordTypeEntry) {
                                    recordTypeDeveloperName = recordTypeEntry.DeveloperName;
                                }

                                // resolve field default values
                                __resolveObjectFieldDefaultValue(objectType, recordTypeDeveloperName, newSObjectRecord).then(function (resolvedObject) {
                                    // set owner, CreatedBy, LastModifiedBy, IsDeleted default values
                                    resolvedObject['IsDeleted'] = false;
                                    var userInfo = {
                                        Id: currentUser.Id,
                                        Name: currentUser.Name,
                                        _soupEntryId: currentUser._soupEntryId
                                    };
                                    resolvedObject['OwnerId'] = currentUser.Id;
                                    resolvedObject['OwnerId_sid'] = currentUser._soupEntryId;
                                    resolvedObject['OwnerId_type'] = 'User';
                                    resolvedObject['Owner'] = userInfo;
                                    resolvedObject['LastModifiedById'] = currentUser.Id;
                                    resolvedObject['LastModifiedById_sid'] = currentUser._soupEntryId;
                                    resolvedObject['LastModifiedById_type'] = 'User';
                                    resolvedObject['LastModifiedBy'] = userInfo;
                                    resolvedObject['CreatedById'] = currentUser.Id;
                                    resolvedObject['CreatedById_sid'] = currentUser._soupEntryId;
                                    resolvedObject['CreatedById_type'] = 'User';
                                    resolvedObject['CreatedBy'] = userInfo;
                                    resolvedObject['attributes'] = {
                                        type: objectType
                                    };

                                    if (recordTypeEntry) {
                                        resolvedObject['RecordTypeId'] = recordTypeEntry.Id;
                                        resolvedObject['RecordTypeId_sid'] = recordTypeEntry._soupEntryId;
                                        resolvedObject['RecordType'] = {
                                            Id: recordTypeEntry.Id,
                                            _soupEntryId: recordTypeEntry._soupEntryId,
                                            Name: recordTypeEntry.Name,
                                            DeveloperName: recordTypeDeveloperName
                                        };
                                    }

                                    void 0;
                                    resolve(resolvedObject);
                                }, reject);

                                // else {
                                //     reject('Failed to load record type by develop name: ' + recordType);
                                // }
                            }, reject);
                        } else {
                            reject('Failed to load current user Information.');
                        }
                    }, reject);
                });
            };

            /**
             * @ngdoc method
             * @name getSObject
             * @methodOf oinio.core.service:LocalDataService
             * @description
             * load sobject from local soup
             *
             * @param {string} objectType - type of the object should be loaded (same as the soup-name)
             * @param {number} _soupEntryId - the _soupEntryId of the object which should be loaded
             *
             * @returns {promise} an objects data with all references as "sub-Objects"
             */
            service.getSObject = function (objectType, _soupEntryId) {
                var deferred = $q.defer();

                if (objectType && _soupEntryId) {
                    // load local entry
                    service.getEntryByExactMatch(objectType, '_soupEntryId', _soupEntryId).then(function (localEntry) {
                        if (localEntry) {
                            void 0;

                            _mountSObjectReferenceEntities(objectType, null, [localEntry]).then(function (mountedEntries) {
                                void 0;
                                deferred.resolve(mountedEntries[0]);
                            }, function (err) {
                                deferred.reject(err);
                            });
                        } else {
                            deferred.reject('No record with entry id: ' + _soupEntryId + ' found in soup: ' + objectType);
                        }
                    }, function (err) {
                        deferred.reject(err);
                    });
                } else {
                    deferred.reject('Invalid parameters, missing objectType or _soupEntryId');
                }

                return deferred.promise;
            };

            /**
             * load sobject records from local soup
             *
             * @param   {string} objectType
             * @param   {Array.<number>} sids
             * @returns {promise}
             */
            service.getSObjects = function (objectType, sids) {

                // TODO: optimize to query all in one query statement instead of multiple times

                var deferred = $q.defer(),
                    results = [];

                var getNextSObject = function (index) {

                    if (index >= sids.length) {
                        deferred.resolve(results);
                    } else {
                        service.getSObject(objectType, sids[index]).then(function (result) {
                            results.push(result);
                            getNextSObject(++index);
                        }, function (error) {
                            deferred.reject(error);
                        });
                    }
                };

                getNextSObject(0);

                return deferred.promise;
            };

            /**
             * For attachment and file please call createFile and createAttachment method.
             *
             * @param objectType: the object type(API name)
             * @param sobjects: a array of objects should be created on the local database. Each of these objects must be valid SFDC Objects
             *
             * @returns an array with objects containing like (which matches the result returned by REST API):
             *   "_soupId": 1234567890,
             *  "errors" : [ ],
             *  "success" : true
             **/
            service.saveSObjects = function (objectType, sobjects) {
                return $q(function (resolve, reject) {
                    if (!objectType || sobjects === null) {
                        reject('LocalDataService.saveSObjects Error: Invalid parameters.');
                    } else if (sobjects.length === 0) {
                        // nothing to do if array is empty
                        resolve([]);
                    } else if (skipCreateSObjects.indexOf(objectType) !== -1) {
                        resolve('LocalDataService.saveSObjects Error: This SObject can not be allowed to create.');
                    } else {
                        //
                        _filterUnconfiguredFieldValues(objectType, sobjects).then(function (filteredSobjects) {
                            void 0;
                            // save the records
                            service.handleCRUDAction(objectType, filteredSobjects, SMARTSTORE_COMMON_SETTING.QUEUE_MESSAGE_ACTION_INSERT).then(function (insertedRecords) {
                                var result = [];
                                angular.forEach(insertedRecords, function (insertedRecord) {
                                    result.push({
                                        _soupEntryId: insertedRecord._soupEntryId,
                                        errors: [],
                                        success: true
                                    });
                                });

                                if (objectType === 'ContentVersion') {
                                    additionDoneForFile(insertedRecords).then(function () {
                                        resolve(result);
                                    }, reject);
                                } else {
                                    resolve(result);
                                }
                            }, reject); // TODO: we do not know what errors might be in local soup operation
                        }, reject);
                    }
                });
            };

            /**
             * @param objectType: the object type(API name)
             * @param sobjects: a array of objects should be updated on the local database. Each of these objects must be valid SFDC Objects
             *
             * @returns an array with objects containing like (which matches the result returned by REST API):
             *   "_soupId": 1234567890,
             *  "errors" : [ ],
             *  "success" : true
             **/
            service.updateSObjects = function (objectType, sobjects) {
                return $q(function (resolve, reject) {
                    if (!objectType || sobjects === null) {
                        reject('LocalDataService.updateSObjects Error: Invalid parameters.');
                    } else if (sobjects.length === 0) {
                        // nothing to do if array is empty
                        resolve([]);
                    } else if (skipUpdateSObjects.indexOf(objectType) !== -1) {
                        resolve('LocalDataService.updateSObjects Error: This SObject can not be allowed to update.');
                    } else {

                        // TODO: we assume all passed in sobjects have _soupEntryId

                        _filterUnconfiguredFieldValues(objectType, sobjects).then(function (filteredSobjects) {
                            void 0;

                            // collect soup entry ids
                            var soupEntryIdRrecordMap = {}, involvedSoupEntryIds = [];
                            angular.forEach(filteredSobjects, function (filteredRecord) {
                                var soupEntryId = filteredRecord._soupEntryId;
                                if (soupEntryId) {
                                    soupEntryIdRrecordMap[soupEntryId] = filteredRecord;
                                    if (involvedSoupEntryIds.indexOf(soupEntryId) === -1) {
                                        involvedSoupEntryIds.push(soupEntryId);
                                    }
                                }
                            });

                            void 0;

                            // get all involved data that stored in smartstore
                            navigator.smartstore.retrieveSoupEntries(objectType, involvedSoupEntryIds, function (entries) {
                                // extend new data
                                var records2update = [];
                                void 0;
                                if (entries && entries.length) {
                                    angular.forEach(entries, function (entry) {
                                        var updateRecord = _.extend(entry, soupEntryIdRrecordMap[entry._soupEntryId]);
                                        records2update.push(updateRecord);
                                    });
                                }

                                // update records
                                service.handleCRUDAction(objectType, records2update, SMARTSTORE_COMMON_SETTING.QUEUE_MESSAGE_ACTION_UPDATE).then(function (updatedRecords) {
                                    var result = [];
                                    angular.forEach(updatedRecords, function (updatedRecord) {
                                        result.push({
                                            _soupEntryId: updatedRecord._soupEntryId,
                                            errors: [],
                                            success: true
                                        });
                                    });

                                    resolve(result);
                                }, reject); // TODO: we do not know what errors might be in local soup operation
                            }, reject);
                        }, reject);
                    }
                });
            };

            /**
             * For delete file and attachment, please call deleteFile, deleteAttachment method.
             *
             * @param objectType: the object type(API name)
             * @param sobjects: an array of sobjects of entries should be deleted. At least we need need the Salesforce Id or _suopId and a
             * type propery
             * "_soupId": 1234567890
             *  "errors" : [ ],
             *  "success" : true
             **/
            service.deleteSObjects = function (objectType, sobjects) {
                return $q(function (resolve, reject) {
                    if (!objectType || sobjects === null) {
                        reject('LocalDataService.deleteSObjects Error: Invalid parameters.');
                    } else if (sobjects.length === 0) {
                        // nothing to do if array is empty
                        resolve([]);
                    } else if (skipDeleteSObjects.indexOf(objectType) !== -1) {
                        resolve('LocalDataService.deleteSObjects Error: This SObject can not be allowed to delete.');
                    } else {
                        // collect all entry id
                        var entryIds = [];
                        angular.forEach(sobjects, function (record) {
                            entryIds.push(record._soupEntryId);
                        });
                        // In the local delete process, we do not delete any records phsically. We just set the field IsDeleted to TRUE
                        navigator.smartstore.retrieveSoupEntries(objectType, entryIds, function (entries) {
                            service.handleCRUDAction(objectType, entries, SMARTSTORE_COMMON_SETTING.QUEUE_MESSAGE_ACTION_DELETE).then(function (deletedRecords) {
                                var result = [];
                                angular.forEach(deletedRecords, function (deletedRecord) {
                                    result.push({
                                        _soupEntryId: deletedRecord._soupEntryId,
                                        errors: [],
                                        success: true
                                    });
                                });

                                resolve(result);
                            }, reject); // TODO: we do not know what errors might be in local soup operation
                        }, reject);
                    }
                });
            };

            /**
             * @ngdoc method
             * @name createFile
             * @methodOf oinio.core.service:LocalDataService
             * @description
             * Create a new file under a specific record, and this file must be the first version.
             *
             * @param {object} param - including some necessary information and file data as belows:
             *          {string} fileName - stored file name
             *          {string} [fileNameInSalesforce] - stored file name in salesforce, if undefined, will use fileName
             *          {string} fileDescription - file description
             *          {object|string} fileData - file data for saving (data type is ArrayBuffer or Base64 string)
             *          {string} targetObjectType - target object type of this file
             *          {string} [targetId] - optional(if target record is local data), target object record salesforce id of this file
             *          {number} targetSoupEntryId - target object record _soupEntryId of this file
             *
             * @returns {promise} return new create contentDocument soup id(as same as fileName)
             */
            service.createFile = function (param) {
                var deferred = $q.defer();

                var _suffix = SMARTSTORE_COMMON_SETTING.REFERENCED_FIELD_EXTENSION_SUFFIX;
                var fileName = param['fileName'] || '';
                var fileNameInSalesforce = param['fileNameInSalesforce'] || fileName;
                var fileDescription = param['fileDescription'] || '';
                var fileData = param['fileData'];
                var targetObjectType = param['targetObjectType'];
                var targetId = param['targetId'];
                var targetSoupEntryId = param['targetSoupEntryId'];

                var userInfo = LocalCacheService.get('userInfo');

                // initialize a new contentVersion
                service.createSObject('ContentVersion').then(function (contentVersion) {
                    contentVersion['Title'] = fileNameInSalesforce;
                    contentVersion['PathOnClient'] = fileName;
                    contentVersion['Description'] = fileDescription;
                    contentVersion['VersionNumber'] = '1';
                    contentVersion['NetworkId'] = userInfo['networkId'];

                    // insert the contentVersion, in this process including create a new related contentDocument
                    service.saveSObjects('ContentVersion', [contentVersion]).then(function (result) {
                        navigator.smartstore.retrieveSoupEntries('ContentVersion', [result[0]._soupEntryId], function (entries) {
                            var insertedContentVersion = entries[0];

                            // save file data in file system by contentDocument soup id
                            FileService.saveFileData({_soupEntryId: insertedContentVersion['ContentDocumentId' + _suffix]}, fileData).then(function () {

                                if ((targetObjectType && targetSoupEntryId) || targetId) {

                                    // initialize a new contentDocumentLink
                                    service.createSObject('ContentDocumentLink').then(function (contentDocumentLink) {

                                        contentDocumentLink['ContentDocumentId' + _suffix] = insertedContentVersion['ContentDocumentId' + _suffix];
                                        contentDocumentLink['LinkedEntityId'] = targetId;
                                        contentDocumentLink['LinkedEntityId' + _suffix] = targetSoupEntryId;
                                        contentDocumentLink['LinkedEntityId' + SMARTSTORE_COMMON_SETTING.REFERENCED_FIELD_TYPE_SUFFIX] = targetObjectType;
                                        contentDocumentLink['ShareType'] = 'V';
                                        contentDocumentLink['Visibility'] = 'AllUsers';

                                        // insert the contentDocumentLink into smartStore and create queue for waiting sync it up
                                        service.saveSObjects('ContentDocumentLink', [contentDocumentLink]).then(function () {
                                            deferred.resolve(insertedContentVersion['ContentDocumentId' + _suffix]);
                                        }, function (error) {
                                            deferred.reject('LocalDataService.createFile error: ' + JSON.stringify(error));
                                        });
                                    }, function (error) {
                                        deferred.reject(error);
                                    });
                                } else {
                                    deferred.resolve(insertedContentVersion['ContentDocumentId' + _suffix]);
                                }
                            }, function (error) {
                                deferred.reject('LocalDataService.createFile error: ' + JSON.stringify(error));
                            });
                        }, function (error) {
                            deferred.reject('LocalDataService.createFile error: ' + JSON.stringify(error));
                        });
                    }, function (error) {
                        deferred.reject('LocalDataService.createFile error: ' + JSON.stringify(error));
                    });
                }, function (error) {
                    deferred.reject(error);
                });

                return deferred.promise;
            };

            /**
             * @ngdoc method
             * @name updateFileWithNewVersion
             * @methodOf oinio.core.service:LocalDataService
             * @description
             * Update file with a new version.
             *
             * @param {object} param - including some necessary information and file data as belows:
             *          {string} fileName - stored file name
             *          {string} [fileNameInSalesforce] - stored file name in salesforce, if undefined, will use fileName
             *          {string} fileDescription - file description
             *          {object|string} fileData - file data for saving (data type is ArrayBuffer or Base64 string)
             *          {number} contentDocumentSid - the contentDocument _soupEntryId of this file
             *
             * @returns {promise}
             */
            service.updateFileWithNewVersion = function (param) {
                var deferred = $q.defer();

                var _suffix = SMARTSTORE_COMMON_SETTING.REFERENCED_FIELD_EXTENSION_SUFFIX;
                var fileName = param['fileName'] || '';
                var fileNameInSalesforce = param['fileNameInSalesforce'] || fileName;
                var fileDescription = param['fileDescription'] || '';
                var fileData = param['fileData'];
                var contentDocumentSid = param['contentDocumentSid'];

                // update contentDocument information and file data in file system
                var updateContentDocumentAndFile = function (contentVersion) {
                    navigator.smartstore.retrieveSoupEntries('ContentDocument', [contentDocumentSid], function (entries) {
                        var contentDocument = entries[0];

                        overwriteExistPropertyValue(contentDocument, contentVersion);

                        navigator.smartstore.upsertSoupEntries('ContentDocument', [contentDocument], function () {

                            // overwrite old version file by new version file
                            FileService.saveFileData(contentDocument, fileData).then(function () {
                                deferred.resolve(true);
                            }, function (error) {
                                deferred.reject('LocalDataService.updateFileWithNewVersion error: ' + JSON.stringify(error));
                            });
                        }, function (error) {
                            deferred.reject('LocalDataService.updateFileWithNewVersion error: ' + JSON.stringify(error));
                        });
                    }, function (error) {
                        deferred.reject('LocalDataService.updateFileWithNewVersion error: ' + JSON.stringify(error));
                    });
                };

                // query the latest contentVersion record
                var querySpec = navigator.smartstore.buildExactQuerySpec('ContentDocumentId' + _suffix, contentDocumentSid, 1, 'descending', 'VersionNumber');
                navigator.smartstore.querySoup('ContentVersion', querySpec, function (cursor) {
                    if (cursor && cursor.currentPageOrderedEntries && cursor.currentPageOrderedEntries.length === 1) {
                        var latestContentVersion = cursor.currentPageOrderedEntries[0];

                        // if the latest contentVersion record has been already sync up, then create a new contentVersion for storing into smartStore waiting sync up;
                        // otherwise update the local contentVersion record.
                        if (latestContentVersion.Id) {

                            // initialize a new contentVersion record
                            service.createSObject('ContentVersion').then(function (contentVersion) {
                                contentVersion['Title'] = fileNameInSalesforce;
                                contentVersion['PathOnClient'] = fileName;
                                contentVersion['Description'] = fileDescription;
                                contentVersion['VersionNumber'] = (parseInt(latestContentVersion['VersionNumber']) + 1) + '';
                                contentVersion['ContentDocumentId'] = latestContentVersion['ContentDocumentId'];
                                contentVersion['ContentDocumentId' + _suffix] = contentDocumentSid;

                                // save the contentVersion record
                                service.saveSObjects('ContentVersion', [contentVersion]).then(function (result) {

                                    updateContentDocumentAndFile(contentVersion);
                                }, function (error) {
                                    deferred.reject('LocalDataService.updateFileWithNewVersion error: ' + JSON.stringify(error));
                                });
                            }, function (error) {
                                deferred.reject(error);
                            });
                        } else {
                            latestContentVersion['Title'] = fileNameInSalesforce;
                            latestContentVersion['PathOnClient'] = fileName;
                            latestContentVersion['Description'] = fileDescription;

                            // update the contentVersion record which is waiting for sync up
                            navigator.smartstore.upsertSoupEntries('ContentVersion', [latestContentVersion], function () {

                                updateContentDocumentAndFile(latestContentVersion);
                            }, function (error) {
                                deferred.reject('LocalDataService.updateFileWithNewVersion error: ' + JSON.stringify(error));
                            });
                        }
                    } else {
                        deferred.reject('LocalDataService.updateFileWithNewVersion error: not found the latest contentVersion record.');
                    }
                });

                return deferred.promise;
            };

            /**
             * @ngdoc method
             * @name deleteFile
             * @methodOf oinio.core.service:LocalDataService
             * @description
             * Delete file according contentDocument soup id
             *
             * @param {number} contentDocumentSid - the contentDocument _soupEntryId of the file which will be deleted
             *
             * @returns {promise}
             */
            service.deleteFile = function (contentDocumentSid) {
                var deferred = $q.defer();

                var _suffix = SMARTSTORE_COMMON_SETTING.REFERENCED_FIELD_EXTENSION_SUFFIX;

                // remove contentDocument record in smartStore, if this file already exist in salesforce, add a _queue for waiting to sync up it.
                service.deleteSObjects('ContentDocument', [{_soupEntryId: contentDocumentSid}]).then(function () {

                    var querySpec = navigator.smartstore.buildExactQuerySpec('ContentDocumentId' + _suffix, contentDocumentSid, SMARTSTORE_COMMON_SETTING.PAGE_SIZE_FOR_ALL);

                    // query all related contentVersion records, then remove them
                    navigator.smartstore.querySoup('ContentVersion', querySpec, function (cursor) {
                        var contentVersionIds = _.pluck(cursor.currentPageOrderedEntries, '_soupEntryId');
                        navigator.smartstore.removeFromSoup('ContentVersion', contentVersionIds, function () {

                            // query all related contentDocumentLink records, then remove them
                            navigator.smartstore.querySoup('ContentDocumentLink', querySpec, function (cursor2) {
                                var contentDocumentLinkIds = _.pluck(cursor2.currentPageOrderedEntries, '_soupEntryId');
                                navigator.smartstore.removeFromSoup('ContentDocumentLink', contentDocumentLinkIds, function () {

                                    // delete the file in file system.
                                    FileService.removeFileBySids([contentDocumentSid]).then(function () {
                                        deferred.resolve(true);
                                    }, function (error) {
                                        deferred.reject('LocalDataService.deleteFile error: ' + JSON.stringify(error));
                                    });
                                });
                            });
                        });
                    });
                }, function (error) {
                    deferred.reject('LocalDataService.deleteFile error: ' + JSON.stringify(error));
                });

                return deferred.promise;
            };

            /**
             * Addition deal operation for create a new contentVersion, including create a new ContentDocument when contentVersion is the first one,
             * or update the existing related ContentDocument by new version file information.
             *
             * @param {Array} records: a array of contentVersion objects which should be created on the local database.
             * @returns
             **/
            function additionDoneForFile(records) {
                return $q(function (resolve, reject) {

                    // Create ContentDocument, or link an existing related ContentDocument and update it
                    var upsertContentDocument = function (index) {

                        if (index >= records.length) {
                            resolve();
                        } else {
                            var contentVersion = records[index];
                            var contentDocumentSid = contentVersion['ContentDocumentId' + SMARTSTORE_COMMON_SETTING.REFERENCED_FIELD_EXTENSION_SUFFIX];

                            // if existing related ContentDocument, then update it
                            if (contentDocumentSid) {
                                navigator.smartstore.retrieveSoupEntries('ContentDocument', [contentDocumentSid], function (entries) {
                                    if (entries && entries.length === 1) {
                                        var contentDocument = entries[0];

                                        overwriteExistPropertyValue(contentDocument, contentVersion);

                                        navigator.smartstore.upsertSoupEntries('ContentDocument', [contentDocument], function () {
                                            upsertContentDocument(index + 1);
                                        }, function (error) {
                                            reject(error);
                                        });
                                    } else {
                                        reject('LocalDataService.additionDoneForFile error: can not get correct ContentDocument of _soupEntryId ' + contentDocumentSid);
                                    }
                                }, function (error) {
                                    reject(error);
                                });
                            } else {

                                // if it is the first ContentVersion, then create a new ContentDocument for it
                                service.createSObject('ContentDocument').then(function (contentDocument) {
                                    overwriteExistPropertyValue(contentDocument, contentVersion);

                                    navigator.smartstore.upsertSoupEntries('ContentDocument', [contentDocument], function (insertedContentDocument) {

                                        // update new create contentDocument sid into contentVersion
                                        contentVersion['ContentDocumentId' + SMARTSTORE_COMMON_SETTING.REFERENCED_FIELD_EXTENSION_SUFFIX] = insertedContentDocument[0]._soupEntryId;
                                        navigator.smartstore.upsertSoupEntries('ContentVersion', [contentVersion], function () {
                                            upsertContentDocument(index + 1);
                                        }, function (error) {
                                            reject(error);
                                        });
                                    }, function (error) {
                                        reject(error);
                                    });
                                }, function (error) {
                                    reject(error);
                                });
                            }
                        }
                    };

                    upsertContentDocument(0);

                });
            }

            /**
             * @ngdoc method
             * @name createAttachment
             * @methodOf oinio.core.service:LocalDataService
             * @description
             * Create a new attachment under a specific record.
             *
             * @param {object} param - including some necessary information and attachment data as belows:
             *          {string} fileName - the name of the attachment
             *          {string} description - attachment description
             *          {object|string} body - data of the Attachment (data type is ArrayBuffer or Base64 string)
             *          {string} [contentType] - content type of the Attachment
             *          {string} parentObjectType - parent object type of the attachment
             *          {string} [parentId] - optional(if parent record is local data), Salesforce Id for parent object
             *          {number} parentSoupEntryId - parent object record _soupEntryId of the attachment
             *
             * @returns {promise} return new create attachment soup id(as same as fileName)
             */
            service.createAttachment = function (param) {
                var deferred = $q.defer();

                var fileName = param['fileName'] || '';
                var description = param['description'];
                var body = param['body'];
                var contentType = param['contentType'];
                var parentObjectType = param['parentObjectType'];
                var parentId = param['parentId'];
                var parentSoupEntryId = param['parentSoupEntryId'];

                // initialize a new attachment
                service.createSObject('Attachment').then(function (attachment) {
                    attachment['Name'] = fileName;
                    attachment['Description'] = description;
                    attachment['ContentType'] = contentType;
                    attachment['ParentId' + SMARTSTORE_COMMON_SETTING.REFERENCED_FIELD_TYPE_SUFFIX] = parentObjectType;
                    attachment['ParentId'] = parentId;
                    attachment['ParentId' + SMARTSTORE_COMMON_SETTING.REFERENCED_FIELD_EXTENSION_SUFFIX] = parentSoupEntryId;

                    // insert the attachment, with the queue record for waiting for sync it up
                    service.saveSObjects('Attachment', [attachment]).then(function (result) {
                        navigator.smartstore.retrieveSoupEntries('Attachment', [result[0]._soupEntryId], function (entries) {
                            var insertedAttachment = entries[0];

                            // get attachment related object type configuration information
                            service.queryConfiguredObjectByName(parentObjectType).then(function (relatedObjectType) {

                                // save attachment body into soup AttachmentBody or file system
                                FileService.saveAttachmentBody(insertedAttachment, relatedObjectType, body).then(function () {
                                    deferred.resolve(insertedAttachment._soupEntryId);
                                }, function (error) {
                                    deferred.reject('LocalDataService.createAttachment error: ' + JSON.stringify(error));
                                });
                            }, function (error) {
                                deferred.reject('LocalDataService.createAttachment error: ' + JSON.stringify(error));
                            });
                        }, function (error) {
                            deferred.reject('LocalDataService.createAttachment error: ' + JSON.stringify(error));
                        });
                    }, function (error) {
                        deferred.reject('LocalDataService.createAttachment error: ' + JSON.stringify(error));
                    });
                }, function (error) {
                    deferred.reject(error);
                });

                return deferred.promise;
            };

            /**
             * @ngdoc method
             * @name deleteAttachment
             * @methodOf oinio.core.service:LocalDataService
             * @description
             * Delete attachment according its _soupEntryId, including delete attachment data in file system or in soup AttachmentBody
             *
             * @param {number} attachmentSid - the attachment _soupEntryId which will be deleted
             *
             * @returns {promise}
             */
            service.deleteAttachment = function (attachmentSid) {
                var deferred = $q.defer();

                // get attachment entries
                navigator.smartstore.retrieveSoupEntries('Attachment', [attachmentSid], function (entries) {

                    if (entries.length > 0) {
                        var attachment = entries[0];

                        // remove the attachment record in smartStore, if this attachment already exist in salesforce, add a _queue for waiting to sync up it.
                        service.deleteSObjects('Attachment', [attachment]).then(function () {

                            // get attachment related object type configuration information
                            service.queryConfiguredObjectByName(attachment['ParentId_type']).then(function (parentObjectType) {

                                // clear attachment body data from soup or file system
                                if (parentObjectType['MobileVizArt__Attachments_Encrypted__c']) {

                                    // query all related AttachmentBody records soup id array
                                    service.getAllRecordsSidBySoup('AttachmentBody', '{AttachmentBody:AttachmentSid} = ' + attachmentSid).then(function (attachmentBodySidArray) {

                                        // delete the AttachmentBody record
                                        navigator.smartstore.removeFromSoup('AttachmentBody', attachmentBodySidArray, function () {
                                            deferred.resolve(true);
                                        }, function (error) {
                                            deferred.reject('LocalDataService.deleteAttachment error: ' + JSON.stringify(error));
                                        });
                                    }, function (error) {
                                        deferred.reject('LocalDataService.deleteAttachment error: ' + JSON.stringify(error));
                                    });
                                } else {

                                    // delete the file in file system.
                                    FileService.removeAttachmentBySids([attachmentSid]).then(function () {
                                        deferred.resolve(true);
                                    }, function (error) {
                                        deferred.reject('LocalDataService.deleteAttachment error: ' + JSON.stringify(error));
                                    });
                                }
                            }, function (error) {
                                deferred.reject('LocalDataService.deleteAttachment error: ' + JSON.stringify(error));
                            });
                        }, function (error) {
                            deferred.reject('LocalDataService.deleteAttachment error: ' + JSON.stringify(error));
                        });
                    } else {
                        deferred.resolve(true);
                    }
                });

                return deferred.promise;
            };

            /**
             * @ngdoc method
             * @name overwriteExistPropertyValue
             * @methodOf oinio.core.service:LocalDataService
             * @description
             * Overwrite exist property value in target object by the same property name of source object,
             * ignore not exist source property name in target object.
             *
             * @param object: the target object
             * @param source: the source object for provide new overwrite property value
             * @param {Array} [skipProperties]: string array - skip overwrite properties
             *
             * @returns
             **/
            function overwriteExistPropertyValue(object, source, skipProperties) {
                skipProperties = skipProperties || ['Id', '_soupEntryId', 'IsDeleted'];

                var fieldsInSource = _.keys(source);
                var fields = _.keys(object);
                for (var i = 0; i < fields.length; i++) {
                    var fieldName = fields[i];
                    if (fieldsInSource.indexOf(fieldName) !== -1 && skipProperties.indexOf(fieldName) === -1) {
                        object[fieldName] = source[fieldName];
                    }
                }
            }

            /**
             * @param objectType: the object type(API name)
             * @param records: a array of objects should be created on the local database. Each of these objects must be valid SFDC Objects
             * @param action: the crud aciton, match SMARTSTORE_COMMON_SETTING.QUEUE_MESSAGE_ACTION_INSERT,
             *                                       SMARTSTORE_COMMON_SETTING.QUEUE_MESSAGE_ACTION_UPDATE,
             *                                       SMARTSTORE_COMMON_SETTING.QUEUE_MESSAGE_ACTION_DELETE
             * @param isLocalAction: if true will not create queue message for records
             *
             * @returns the stored records
             **/
            service.handleCRUDAction = function (objectType, records, action, isLocalAction) {
                return $q(function (resolve, reject) {
                    void 0;
                    var actions = [SMARTSTORE_COMMON_SETTING.QUEUE_MESSAGE_ACTION_INSERT,
                        SMARTSTORE_COMMON_SETTING.QUEUE_MESSAGE_ACTION_UPDATE,
                        SMARTSTORE_COMMON_SETTING.QUEUE_MESSAGE_ACTION_DELETE];
                    if (!objectType || !records || !records.length || !action || actions.indexOf(action) === -1) {
                        reject('LocalDataService.handleCRUDAction Error: Invalid parameters.');
                    } else {
                        // handle delete action
                        // In the local delete process, if the record has sfdc id we do not delete any records phsically. We just set the field IsDeleted to TRUE
                        // else remove both the local record and queue message
                        var actionResult = [];
                        if (action === SMARTSTORE_COMMON_SETTING.QUEUE_MESSAGE_ACTION_DELETE) {
                            var records2remove = [], records2updateIsDeleted = [];
                            angular.forEach(records, function (record) {
                                if (record.Id) {
                                    record.IsDeleted = true;
                                    records2updateIsDeleted.push(record);
                                } else {
                                    records2remove.push(record._soupEntryId);
                                }
                            });

                            // remove local record that have not sync to Salesforce yet
                            navigator.smartstore.removeFromSoup(objectType, records2remove, function () {

                                // update IsDeleted = true for local record that have been synced to Salesforce
                                navigator.smartstore.upsertSoupEntries(objectType, records2updateIsDeleted, function (upsertedRecords) {
                                    if (isLocalAction) {
                                        resolve(upsertedRecords);
                                    } else {
                                        // handle queue message
                                        _handleQueueAction(objectType, records, action).then(function (handledResult) {
                                            resolve(upsertedRecords);
                                        }, reject);
                                    }
                                }, reject);
                            }, reject);
                        } else {
                            // handle upsert action
                            navigator.smartstore.upsertSoupEntries(objectType, records, function (upsertedRecords) {
                                void 0;
                                if (isLocalAction) {
                                    resolve(upsertedRecords);
                                } else {
                                    // handle queue messages
                                    _handleQueueAction(objectType, upsertedRecords, action).then(function (handledResult) {
                                        resolve(upsertedRecords);
                                    }, reject);
                                }
                            }, reject);
                        }
                    }
                });
            };

            /**
             * @param {string} objectType: the object type(API name)
             * @param {string} searchTerm: search term, will filter the search fields configured on the mobile object
             * @param {number} [limitSize]: limit size, will get this limit size amount of records
             * @param {string} [orderBy]: ORDER By field for query
             * @param {string} [direction=ASC]: ASC or DESC
             * @param {string} [lookupfilter] - sets the filter for a specific type defined in lookupfilter.json
             *
             * @returns records in promise
             **/
            service.globalSearch = function (objectType, searchTerm, limitSize, orderBy, direction, filterConfig) {
                return $q(function (resolve, reject) {

                    // set order direction in case of orderBy field is set and direction not
                    if(orderBy && !direction){
                        direction = 'ASC';
                    }

                    if (!objectType) {
                        reject('LocalDataService.globalSearch error: object type is required.');
                    } else {
                        // get searchable fields
                        _getObjectConfiguredFields(objectType).then(function (configuredFields) {
                            // build query sql
                            var sql = 'SELECT {' + objectType + ':_soup} FROM {' + objectType + '}',
                                whereSql = ' WHERE 1=1 ';

                            // as UserTeamMember has no IsDeleted field, ignore the filte condition
                            if (configuredFields.configuredFields && configuredFields.configuredFields.indexOf('IsDeleted') !== -1) {
                                whereSql += 'AND {' + objectType + ':IsDeleted} = 0';
                            }

                            if (objectType === 'Lead') {
                                whereSql += ' AND {' + objectType + ':IsConverted} = 0';
                            }

                            var searchableFields = configuredFields ? configuredFields.searchableFields : [];

                            if (searchableFields.length && searchTerm && searchTerm.length) {
                                whereSql += ' AND (';
                                for (var i = 0; i < searchableFields.length; i++) {
                                    var searchableField = searchableFields[i].trim();
                                    if (searchableField) {
                                        whereSql += ' {' + objectType + ':' + searchableField + '} like \'%' + searchTerm + '%\' OR ';
                                    }
                                }

                                // remove the last OR
                                whereSql = whereSql.substring(0, whereSql.length - 3);
                                whereSql += ')'; // close or condition
                            }

                            if (filterConfig) {
                                whereSql += filterConfig;
                            }

                            sql += whereSql;

                            if(orderBy && searchableFields.indexOf(orderBy) !== -1){
                                sql += ' ORDER BY {' + objectType + ':' + orderBy + '} ' + direction;
                            }

                            if (limitSize) {
                                sql += ' LIMIT ' + limitSize;
                            }

                            void 0;
                            var querySpec = navigator.smartstore.buildSmartQuerySpec(sql, SMARTSTORE_COMMON_SETTING.PAGE_SIZE_FOR_ALL);
                            navigator.smartstore.runSmartQuery(querySpec, function (cursor) {
                                var queryResult = [];
                                if (cursor && cursor.currentPageOrderedEntries && cursor.currentPageOrderedEntries.length) {
                                    angular.forEach(cursor.currentPageOrderedEntries, function (item) {
                                        queryResult.push(item[0]);
                                    });
                                }

                                if (queryResult.length) {
                                    var contentListFields = configuredFields ? configuredFields.listFields : [];

                                    // collect look up fields
                                    var referenceFields = [], refer2EntityFieldNames2Load = {};
                                    angular.forEach(contentListFields, function (contentListField) {
                                        // only consider one level cascading, i.g.: Account.Name, Book__r.Name, no Account.Owner.Name
                                        if (contentListField.indexOf('.') > -1 && contentListField.split('.').length === 2) {
                                            var referenceField = contentListField.split('.')[0].trim();
                                            if (_.endsWith(referenceField, '__r')) {
                                                referenceField = referenceField.substring(0, referenceField.length - 1) + 'c';
                                            } else {
                                                referenceField += 'Id';
                                            }
                                            if (referenceFields.indexOf(referenceField) === -1) {
                                                referenceFields.push(referenceField);
                                            }
                                            if (!refer2EntityFieldNames2Load[referenceField]) {
                                                refer2EntityFieldNames2Load[referenceField] = [];
                                            }
                                            refer2EntityFieldNames2Load[referenceField].push(contentListField.split('.')[1].trim());
                                        }
                                    });

                                    void 0;

                                    // collect reference fields informations
                                    _mountSObjectReferenceEntities(objectType, referenceFields, queryResult, refer2EntityFieldNames2Load).then(function (mountedEntries) {
                                        void 0;

                                        // restructure list field
                                        service.getFieldInformations(objectType).then(function (fields) {
                                            var referenceFieldName2referenceObjectNameMap = {};
                                            angular.forEach(fields, function (field) {
                                                if (field.type === 'reference' && field.referenceTo.length) {
                                                    referenceFieldName2referenceObjectNameMap[field.name] = field.referenceTo[0];
                                                }
                                            });

                                            angular.forEach(mountedEntries, function (mountedEntry) {
                                                mountedEntry._listFields = [];
                                                angular.forEach(contentListFields, function (contentListField) {
                                                    contentListField = contentListField.trim(); // CreatedBy.Name, Book__r.Name
                                                    var listFieldEntity = {};
                                                    if (contentListField.indexOf('.') > -1 && contentListField.split('.').length === 2) {
                                                        var referenceFieldEntityName = contentListField.split('.')[0].trim(), // CreatedBy, Book__c
                                                            referenceField = contentListField.split('.')[1].trim(), // Name
                                                            referenceFieldName = contentListField.split('.')[0].trim(); // CreatedById, Book__c

                                                        if (_.endsWith(referenceFieldEntityName, '__r')) {
                                                            referenceFieldEntityName = referenceFieldEntityName.substring(0, referenceFieldEntityName.length - 1) + 'c';
                                                            referenceFieldName = angular.copy(referenceFieldEntityName);
                                                        } else {
                                                            referenceFieldName += 'Id';
                                                        }

                                                        if (mountedEntry[referenceFieldEntityName]) {
                                                            listFieldEntity.value = mountedEntry[referenceFieldEntityName][referenceField];
                                                            listFieldEntity.fieldTranslateKey = objectType + '.' + referenceFieldName;
                                                            listFieldEntity.refer2FieldTranslateKey = referenceFieldName2referenceObjectNameMap[referenceFieldName] +
                                                                '.' + referenceField;
                                                        }
                                                    } else {
                                                        listFieldEntity.value = mountedEntry[contentListField];
                                                        listFieldEntity.fieldTranslateKey = objectType + '.' + contentListField;
                                                    }

                                                    mountedEntry._listFields.push(listFieldEntity);
                                                });
                                            });

                                            resolve(mountedEntries);
                                        }, reject);
                                    }, reject);
                                } else {
                                    resolve([]);
                                }
                            }, function (err) {
                                void 0;
                                reject(err);
                            });
                        }, reject);
                    }
                });
            };

            /**
             * get the object configured fields, such as searchable fields, list content fields
             *
             * @param   {String} objectName the object type name
             * @returns {promise} object - {searchableFields: [], listFields: [], ...}
             */
            var _getObjectConfiguredFields = function (objectName) {
                return $q(function (resolve, reject) {
                    if (!objectName) {
                        reject('LocalDataService._getObjectSearchableFields error: missing parameter.');
                    } else {
                        var result = {
                            searchableFields: [],
                            listFields: [],
                            configuredFields: []
                        };
                        _resolveObjectNameOrSubjectField(objectName).then(function (nameOrSubject) {
                            result.searchableFields = nameOrSubject ? [nameOrSubject] : [];

                            // get searchable fields
                            service.queryConfiguredObjectByName(objectName).then(function (objectConfiguration) {
                                if (objectConfiguration) {
                                    // collect all configured fields
                                    if (objectConfiguration['MobileVizArt__Fields__c'] && objectConfiguration['MobileVizArt__Fields__c'].trim().length) {
                                        angular.forEach(objectConfiguration['MobileVizArt__Fields__c'].split(','), function (configuredFieldName) {
                                            configuredFieldName = configuredFieldName.trim();
                                            if (result.configuredFields.indexOf(configuredFieldName) === -1) {
                                                result.configuredFields.push(configuredFieldName);
                                            }
                                        });
                                    }

                                    // collect all searchable fields
                                    if (objectConfiguration['MobileVizArt__Search_Fields__c'] && objectConfiguration['MobileVizArt__Search_Fields__c'].trim().length) {
                                        angular.forEach(objectConfiguration['MobileVizArt__Search_Fields__c'].split(','), function (searchableFieldName) {
                                            searchableFieldName = searchableFieldName.trim();
                                            if (result.searchableFields.indexOf(searchableFieldName) === -1) {
                                                result.searchableFields.push(searchableFieldName);
                                            }
                                        });
                                    }

                                    // collect all list fields
                                    if (objectConfiguration['MobileVizArt__List_Content_Fields__c'] && objectConfiguration['MobileVizArt__List_Content_Fields__c'].trim().length) {
                                        angular.forEach(objectConfiguration['MobileVizArt__List_Content_Fields__c'].split(','), function (listFieldName) {
                                            listFieldName = listFieldName.trim();
                                            if (result.listFields.indexOf(listFieldName) === -1) {
                                                result.listFields.push(listFieldName);
                                            }
                                        });
                                    }
                                }

                                resolve(result);
                            }, reject);
                        }, reject);
                    }
                });
            };

            /**
             * get the object Name or Subject field
             *
             * @param   {String} objectName the object type name
             * @returns {promise} Name Or Subject field in promise
             */
            var _resolveObjectNameOrSubjectField = function (objectName) {
                return $q(function (resolve, reject) {
                    if (!objectName) {
                        reject('LocalDataService._resolveObjectNameOrSubjectField error: missing parameter.');
                    } else {
                        // get all fields
                        DescribeService.getDescribeSObject(objectName).then(function (describeResult) {
                            var returnFieldName = null;
                            if (describeResult && describeResult.fields) {
                                for (var i = 0; i < describeResult.fields.length; i++) {
                                    if (describeResult.fields[i].name === 'Name') {
                                        returnFieldName = describeResult.fields[i].name;
                                        break;
                                    }

                                    if (describeResult.fields[i].name === 'Subject') {
                                        returnFieldName = describeResult.fields[i].name;
                                        break;
                                    }
                                }
                            }

                            resolve(returnFieldName);
                        }, reject);
                    }
                });
            };

            /**
             * Initial a queue message.
             *
             * @param   {String} targetObjectName the object type name
             * @param   {String} soupEntryId      the soup entry id of the entry of the target object soup
             * @param   {String} sfdcId           the SFDC id of the entry
             * @returns {Object}                  initialized queue message
             */
            var _initQueueMessage = function (targetObjectName, soupEntryId, sfdcId) {
                return {
                    objectName: targetObjectName,
                    recordSoupEntryId: soupEntryId,
                    sfdcId: sfdcId,
                    state: null,
                    action: null,
                    error: null
                };
            };

            /**
             * @param objectType: the object type(API name)
             * @param records: a array of objects should be created on the local database. Each of these objects must be valid SFDC Objects
             * @param action: the crud aciton, match SMARTSTORE_COMMON_SETTING.QUEUE_MESSAGE_ACTION_INSERT,
             *                                       SMARTSTORE_COMMON_SETTING.QUEUE_MESSAGE_ACTION_UPDATE,
             *                                       SMARTSTORE_COMMON_SETTING.QUEUE_MESSAGE_ACTION_DELETE
             *
             * @returns wheather the action do success or Failed
             **/
            var _handleQueueAction = function (objectType, records, action) {
                return $q(function (resolve, reject) {
                    var actions = [SMARTSTORE_COMMON_SETTING.QUEUE_MESSAGE_ACTION_INSERT,
                        SMARTSTORE_COMMON_SETTING.QUEUE_MESSAGE_ACTION_UPDATE,
                        SMARTSTORE_COMMON_SETTING.QUEUE_MESSAGE_ACTION_DELETE];
                    if (!objectType || !action || actions.indexOf(action) === -1 || !records || !records.length) {
                        reject('LocalDataService._handleQueueAction Error: Invalid parameters.');
                    } else {
                        var messages = [], recordSoupEntryIds2remove = [];
                        angular.forEach(records, function (record) {
                            var message = _initQueueMessage(objectType, record._soupEntryId, record.Id);
                            message.action = action;

                            // remove unsynchronized deleted queue
                            if (action === SMARTSTORE_COMMON_SETTING.QUEUE_MESSAGE_ACTION_DELETE && !record.Id) {
                                recordSoupEntryIds2remove.push(record._soupEntryId);
                            } else {
                                messages.push(message);
                            }
                        });

                        _removeExistingQueueMessagesForDeletedRecords(objectType, recordSoupEntryIds2remove).then(function (isOk) {
                            if (isOk === true) {
                                _saveQueueMessages(messages).then(function () {
                                    resolve(true);
                                }, reject);
                            } else {
                                reject('Failed to remove local deleted queue messages.');
                            }
                        }, reject);
                    }
                });
            };

            /**
             * @param messages: messages to save
             *
             * @returns saved messages
             **/
            var _saveQueueMessages = function (messages) {
                return $q(function (resolve, reject) {
                    var queueSoup = SMARTSTORE_COMMON_SETTING.SOUP_NAME_QUEUE;

                    var objectNames = [];
                    var recordSoupEntryIds = [];

                    angular.forEach(messages, function (message) {

                        if (objectNames.indexOf('\'' + message.objectName + '\'') === -1) {
                            objectNames.push('\'' + message.objectName + '\'');
                        }

                        if (recordSoupEntryIds.indexOf(message.recordSoupEntryId) === -1) {
                            recordSoupEntryIds.push(message.recordSoupEntryId);
                        }
                    });

                    // building the query
                    var smartSql = 'select {' + queueSoup + ':_soup} from {' + queueSoup + '} ';
                    smartSql += 'where {' + queueSoup + ':objectName} in (' + objectNames.join(',') + ') ';
                    smartSql += 'and {' + queueSoup + ':recordSoupEntryId} in (' + recordSoupEntryIds.join(',') + ') ';

                    // building querySpec
                    var querySpec = navigator.smartstore.buildSmartQuerySpec(smartSql, SMARTSTORE_COMMON_SETTING.PAGE_SIZE_FOR_ALL);

                    // execute query reference object
                    navigator.smartstore.runSmartQuery(false, querySpec, function (cursor) {

                        var currentPageEntries = _.flatten(cursor.currentPageOrderedEntries), upsertedMessages = [], extraQueueIds2Remove = [];

                        // iteration each queue item
                        angular.forEach(messages, function (message) {

                            var filterCondition = {
                                    objectName: message.objectName + '',
                                    recordSoupEntryId: message.recordSoupEntryId
                                },
                                queue2save = message;

                            var originalQueues = _.where(currentPageEntries, filterCondition);

                            if (originalQueues && originalQueues.length) {
                                // This is an update record
                                var localQueue = originalQueues[0];
                                localQueue.state = null;
                                localQueue.error = null;

                                // get extra queues, will be delete Later
                                for (var i = 1; i < originalQueues.length; i++) {
                                    extraQueueIds2Remove.push(originalQueues[i]._soupEntryId);
                                }

                                if (!message.sfdcId) {
                                    localQueue.action = SMARTSTORE_COMMON_SETTING.QUEUE_MESSAGE_ACTION_INSERT;
                                } else {
                                    localQueue.action = message.action;
                                }

                                queue2save = localQueue;
                            }

                            upsertedMessages.push(queue2save);
                        });

                        // remove extra queue
                        navigator.smartstore.removeFromSoup(queueSoup, extraQueueIds2Remove, function () {
                            // Upsert queue messages
                            navigator.smartstore.upsertSoupEntries(queueSoup, upsertedMessages, function (upsertedMessages) {
                                resolve(upsertedMessages);
                            }, function (error) {
                                reject(error);
                            });
                        }, reject);
                    }, reject);
                });
            };

            /**
             * @description ensure that only necessary and configured fields are included in the SObject
             *
             * @param objectType: the object type(API name)
             * @param sobjects: a array of objects should be created on the local database. Each of these objects must be valid SFDC Objects
             *
             * @returns sobjects: filtered sobjects
             *
             **/
            var _filterUnconfiguredFieldValues = function (objectType, sobjects) {
                return $q(function (resolve, reject) {
                    if (!objectType || !sobjects || !sobjects.length) {
                        reject('Error: Invalid parameters.');
                    } else {

                        // get all configured fields of the sobject
                        service.getFieldInformations(objectType).then(function (fields) {
                            var sobjectConfiguredFields = ['_soupEntryId', '_soupLastModifiedDate', 'attributes'];
                            if (fields && fields.length) {
                                angular.forEach(fields, function (field) {
                                    var fieldName = field.name, fieldType = field.type;
                                    sobjectConfiguredFields.push(fieldName);
                                    if (fieldType === 'reference') {
                                        var sidFieldName = fieldName + SMARTSTORE_COMMON_SETTING.REFERENCED_FIELD_EXTENSION_SUFFIX;
                                        sobjectConfiguredFields.push(sidFieldName);
                                        var typeFieldName = fieldName + SMARTSTORE_COMMON_SETTING.REFERENCED_FIELD_TYPE_SUFFIX;
                                        sobjectConfiguredFields.push(typeFieldName);
                                    }
                                });
                            }

                            // remove unconfigured field value
                            angular.forEach(sobjects, function (record) {
                                for (var k in record) {
                                    if (record.hasOwnProperty(k) && sobjectConfiguredFields.indexOf(k) === -1) {
                                        delete record[k];
                                    }
                                }
                            });

                            resolve(sobjects);
                        }, reject);
                    }
                });
            };

            /**
             * get field default values. especially for record type dependent fields
             *
             * @param {string} objectType - object api name
             * @param {string} recordType - the RecordType developer name of the new record - optional
             * @param {object} newSObjectRecord - object entity
             *
             * @returns {Promise} object with field default values
             */
            var __resolveObjectFieldDefaultValue = function (objectType, recordType, newSObjectRecord) {
                return $q(function (resolve, reject) {
                    if (!objectType || !newSObjectRecord) {
                        return reject('__resolveObjectFieldDefaultValue: Invalid parameters.');
                    }

                    // get all configured fields
                    service.getFieldInformations(objectType).then(function (fields) {
                        var resolveFieldDefaultValuePromises = [];
                        angular.forEach(fields, function (field) {
                            var resolveFieldDefaultValuePromise = _resolveFieldDefaultValue(objectType, recordType, field).then(function (fieldDefaultValue) {
                                void 0;
                                newSObjectRecord[field.name] = fieldDefaultValue;
                            }, function (err) {
                                void 0;
                            });

                            resolveFieldDefaultValuePromises.push(resolveFieldDefaultValuePromise);
                        });

                        $q.all(resolveFieldDefaultValuePromises).then(function () {
                            resolve(newSObjectRecord);
                        }, reject);
                    }, reject);
                });
            };

            /**
             * get field default values. especially for record type dependent fields
             *
             * @param {string} objectType - object api name
             * @param {string} recordType - recordtype developer Name
             * @param {object} field - field schema
             *
             * @returns {Promise} field default value
             */
            var _resolveFieldDefaultValue = function (objectType, recordType, field) {
                return $q(function (resolve, reject) {
                    //console.log(field.name + ' : ' + field.type + ' : ' + field.defaultedOnCreate + ' : ' + field.defaultValueFormula + ' : ' + typeof(field.defaultValueFormula));

                    if (!objectType || !field) {
                        return reject('_resolveFieldDefaultValue: Invalid parameters.');
                    }

                    var fieldName = field.name,
                        fieldType = field.type,
                        fieldDefaultValue = null,
                        resolvePicklistValue;

                    var numberRegex = /^\d+\.?\d*$/,
                        stringRegex = /^(\'[^\']+\'|\"[^\"]+\")$/;

                    switch (fieldType) {
                        case 'string':
                        case 'email':
                        case 'phone':
                        case 'textarea':
                        case 'url':
                            // resolve string type field default value
                            if (stringRegex.test(field.defaultValueFormula)) {
                                fieldDefaultValue = field.defaultValueFormula.substring(1, field.defaultValueFormula.length - 1);
                            }
                            break;
                        case 'double':
                        case 'currency':
                        case 'percent':
                            // resolve number type field default value
                            // for Geolocation type, there are 2 additional field endsWith __s which type is double, do it at the first to ignore check it as number type
                            if (!_.endsWith(fieldName, '__s') && numberRegex.test(field.defaultValueFormula)) {
                                fieldDefaultValue = new Number(field.defaultValueFormula);
                            }
                            break;
                        case 'picklist':
                        case 'multipicklist':
                            if (recordType) {
                                var uniqueExternalDeveloperNameKey = PicklistService.getUniqueExternalKey(objectType, recordType, fieldName);
                                resolvePicklistValue = service.getEntryByExactMatch('_picklists', 'uniqueExternalDeveloperNameKey',
                                    uniqueExternalDeveloperNameKey).then(function (picklistEntry) {

                                    if (picklistEntry && picklistEntry.picklistValues && picklistEntry.picklistValues.length) {
                                        angular.forEach(picklistEntry.picklistValues, function (picklistValue) {
                                            if (picklistValue.active && picklistValue.defaultValue) {
                                                fieldDefaultValue = picklistValue.masterValue;
                                            }
                                        });
                                    }

                                    void 0;
                                }, reject);
                            }

                            break;
                        case 'boolean':
                            // resolve checkbox type field default value
                            // if checkbox default value is null, set false as default value e.g. IsDeleted has no defaultValue defined in DescribeSObjectResult
                            fieldDefaultValue = field.defaultValue !== null ? field.defaultValue : false;
                            break;
                        case 'date':
                        case 'datetime':
                            var datetimeFields = ['CreatedDate', 'LastModifiedDate', 'SystemModstamp'];
                            if (datetimeFields.indexOf(fieldName) > -1) {
                                fieldDefaultValue = new Date().toISOString();
                            }
                            break;
                    }

                    if (resolvePicklistValue) {
                        resolvePicklistValue.then(function () {
                            resolve(fieldDefaultValue);
                        }, reject);
                    } else {
                        resolve(fieldDefaultValue);
                    }
                });
            };

            /**
             * Load DescribeSObject for business objects from Salesforce.
             * This method cannot be defined in DescribeService, otherwise, there would be bi-directional dependency.
             *
             * @param {boolean} [skipReload] - skip reloading describe for business objects
             *
             * @returns {promise} [description]
             */
            service.loadBusinessDescribeSObjects = function (skipReload) {

                var deferred = $q.defer();

                var handleError = function (error) {
                    if (error && typeof error.handle === 'function') {
                        error.retry = service.loadBusinessDescribeSObjects;
                        error.retryDeferred = deferred;
                        error.handle();
                    } else {
                        new Exception(EXCEPTION_SEVERITY.RECOVERABLE, error.status, error.message, error.stack, error, service.loadBusinessDescribeSObjects, null, null, null, deferred).handle();
                    }
                    deferred.reject(error);
                };

                if (!skipReload && ConnectionMonitor.isOnline()) {
                    service.queryConfigurationAndObjects().then(function (configuration) {

                        // configuration objects is null, resolve [];
                        if (configuration.objects === undefined) {
                            deferred.resolve();
                            return;
                        }

                        console.log('obj :::', configuration.objects);

                        var objNames = _.pluck(configuration.objects, 'Name');

                        console.log('objNames:::',objNames);

                        DescribeService.loadDescribeSObjects(objNames).then(function () {
                            deferred.resolve();
                        }, function (err) {
                            handleError(err);
                        });
                    }, function (err) {
                        handleError(err);
                    });
                } else {
                    $log.debug('>>>> they have been already loaded in initialization or offline ... skip refresh describeSObject');
                    console.log('>>>> they have been already loaded in initialization or offline ... skip refresh describeSObject');
                    deferred.resolve();
                }

                return deferred.promise;
            };


            /**
             * Get the CSS styles for object as a pair {class: value, icon: value}.
             *
             * @param {object} array of objects Names
             * @returns {object}
             */
            service.getObjectStylesByName = function (objectsName){
                return $q(function (resolve, reject) {

                    var objectsStyle = [];

                    var _checkIfCacheExistForObject = function(obj)
                    {
                        var objectCached = true;
                        var objectFromCache = [];

                        objectFromCache['style'] = LocalCacheService.get(obj['name'] + 'Class');
                        objectFromCache['icon'] = LocalCacheService.get(obj['icon'] + 'Icon');

                        if(typeof objectFromCache['style'] == 'undefined' || typeof objectFromCache['icon'] == 'undefined')
                        {
                                objectCached = false;
                        }
                        return objectCached;
                    };

                    var _checkIfAllObjectsAreCached = function(objs)
                    {
                        var allObjectsAreCached = true;
                        angular.forEach(objs, function (obj) {
                            allObjectsAreCached = _checkIfCacheExistForObject(obj) == false ? false : allObjectsAreCached;
                        });

                        return allObjectsAreCached;
                    };

                    if(_checkIfAllObjectsAreCached(objectsName) == false) {
                        service.queryConfigurationAndObjects().then(function (configuration) {

                            angular.forEach(configuration['objects'], function (obj) {
                                if (objectsName.indexOf(obj['Name']) !== -1) {

                                    if (_checkIfCacheExistForObject(obj) == false) {
                                        var styledObj = service.applyCssStyleForObject(obj);
                                        LocalCacheService.set(obj['Name'] + 'Class', styledObj['class']);
                                        LocalCacheService.set(obj['Name'] + 'Icon', styledObj['icon']);
                                        objectsStyle[obj['Name']] = styledObj;
                                    }
                                }
                            });
                            resolve(objectsStyle);
                        }, reject);
                    }
                    else
                    {
                        resolve(objectsStyle);
                    }
                });
            };


            /**
             * Extract and resolve style CSS from configuration for object
             *
             * @param {object} One custom object
             * @returns {object}
             */
            service.applyCssStyleForObject = function(obj){
                var iconClassStandard = 'slds-icon-standard-';
                var iconClassCustom = 'slds-icon-custom-';
                var iconHrefStandard = 'lib/salesforce-lightning-design-system/assets/icons/standard-sprite/svg/symbols.svg#';
                var iconHrefCustom = 'lib/salesforce-lightning-design-system/assets/icons/custom-sprite/svg/symbols.svg#';
                var mobileStringConf = 'MobileVizArt__Object_Style_Code__c';
                var objectOut = [];

                if (mobileStringConf in obj && obj[mobileStringConf].length > 0) {
                    objectOut['class'] = iconClassStandard + obj[mobileStringConf];
                    objectOut['icon'] = iconHrefStandard + obj[mobileStringConf];
                }
                else {
                    objectOut['class'] = iconClassCustom + 'custom57';
                    objectOut['icon'] = iconHrefCustom + 'custom57';
                }
                return _constructStyleObjectFromArray(objectOut);
            };

            /**
             * Helper which translate array for Object
             *
             * @param {object} as array
             * @returns {object} as json format
             */
            var _constructStyleObjectFromArray = function(obj)
            {
                obj['class'] = obj['class'] || '';
                obj['icon'] = obj['icon'] || '';
                return {'class': obj['class'], 'icon': obj['icon']};
            };

            /**
             * Query for configured object according to the object name.
             *
             * @param {string} objectName objName
             * @returns {Promise}
             */
            service.queryConfiguredObjectByName = function (objectName) {
                return $q(function (resolve, reject) {
                    if (!objectName) {
                        reject('LocalDataService.queryConfiguredObjectByName error: missing parameter.');
                    } else {

                        if (_configurationObjects) {
                            resolve(_.findWhere(_configurationObjects, {Name: objectName}));
                        } else {
                            service.queryConfigurationAndObjects().then(function (configuration) {
                                var objectConfiguration = null;
                                if (configuration && configuration.objects && configuration.objects.length) {

                                    // cache configuration all objects
                                    _configurationObjects = configuration.objects;

                                    objectConfiguration = _.findWhere(configuration.objects, {Name: objectName});
                                }

                                resolve(objectConfiguration);
                            }, reject);
                        }
                    }
                });
            };

            /**
             * Query for configured object according to the object name.
             *
             * @returns {Promise}
             */
            service.getConfiguredObjects = function () {
                return $q(function (resolve, reject) {
                    service.queryConfigurationAndObjects().then(function (configuration) {
                        var objectConfigurations = null;
                        if (configuration && configuration.objects) {
                            objectConfigurations = configuration.objects;
                        }

                        resolve(objectConfigurations);
                    }, reject);
                });
            };

            /**
             * Query for configuration and objects according to the profile id.
             *
             * @param {string} [profileId] profile id
             * @returns {Promise}
             */
            service.queryConfigurationAndObjects = function (profileId) {

                var deferred = $q.defer();
                var currentUser;

                var configuration = {
                    objects: []
                };

                // get all configuration data from smartStore
                var querySpec = navigator.smartstore.buildAllQuerySpec('Name', null, SMARTSTORE_COMMON_SETTING.PAGE_SIZE_FOR_ALL);
                navigator.smartstore.querySoup(false, '_configuration', querySpec, function (cursor) {

                    var currentPageEntries = cursor.currentPageOrderedEntries;

                    if (APP_SETTINGS.LOCAL_CONFIGURATION === true) {
                        configuration = currentPageEntries.length ? currentPageEntries[0] : null;
                        if (configuration && configuration.objects) {
                            configuration.objects = _.sortBy(configuration.objects, 'MobileVizArt__Level__c');
                        }

                        _filterObjectTypesByPermissions(configuration.objects).then(function (filteredObjects) {
                            configuration.objects = filteredObjects;

                            deferred.resolve(configuration);
                        }, function (error) {
                            deferred.reject(error);
                        });
                    } else {

                        if (!profileId) {

                            void 0;
                            // get current user profile id from cache service.
                            currentUser = LocalCacheService.get('currentUser');
                            if (currentUser) {

                                // get profile id
                                profileId = currentUser['ProfileId'];
                            }
                        }

                        // trim profile id from 18 characters into 15.
                        if (profileId.length > 15) {
                            profileId = profileId.substring(0, 15);
                        }

                        // find configuration matched with current user profile id.
                        var matchConfigurations = $filter('filter')(currentPageEntries, {'MobileVizArt__Profiles__c': profileId});

                        if (matchConfigurations !== undefined && matchConfigurations.length > 0) {
                            configuration = matchConfigurations[0];

                            // get all object data matched current user from smartStore order by MobileVizArt__Level__c ascending
                            var querySpec = navigator.smartstore.buildExactQuerySpec('MobileVizArt__Mobile_Configuration__c',
                                configuration.Id, SMARTSTORE_COMMON_SETTING.PAGE_SIZE_FOR_ALL, null, 'MobileVizArt__Level__c');

                            navigator.smartstore.querySoup(false, '_object', querySpec, function (cursor) {
                                var currentPageEntries = cursor.currentPageOrderedEntries;

                                _filterObjectTypesByPermissions(currentPageEntries).then(function (filteredObjects) {
                                    configuration.objects = filteredObjects;

                                    void 0;
                                    deferred.resolve(configuration);
                                }, function (error) {
                                    deferred.reject(error);
                                });
                            }, function (error) {
                                deferred.reject(error);
                            });
                        } else {
                            void 0;
                            deferred.resolve(null);
                        }
                    }
                }, function (error) {
                    deferred.reject(error);
                });

                return deferred.promise;
            };

            /**
             * Filter object types by their permission for current user.
             *
             * @param {string} objectTypes
             * @returns {Promise}
             */
            var _filterObjectTypesByPermissions = function (objectTypes) {
                var deferred = $q.defer();

                // Get mandatory object
                var mandatoryObjectsConfig = APP_SETTINGS.MANDATORY_OBJECTS;
                var mandatoryObjects = [];
                if (mandatoryObjectsConfig) {
                    mandatoryObjects = mandatoryObjectsConfig.replace(new RegExp(/\s/g), '').split(',');
                }

                MetaService.getMetaValue('objectPermissions').then(function (objectPermissions) {

                    if (objectPermissions && objectTypes && objectTypes.length > 0) {
                        var filteredObjectTypes = [];
                        var filteredObjectNames = [];

                        angular.forEach(objectTypes, function (objType) {
                            var objPermission = objectPermissions[objType.Name];
                            if (objPermission && objPermission['PermissionsRead'] === true) {
                                filteredObjectTypes.push(objType);
                                filteredObjectNames.push(objType.Name);
                            }
                        });

                        var missMandatoryObjects = _.difference(mandatoryObjects, filteredObjectNames);

                        if (missMandatoryObjects && missMandatoryObjects.length > 0) {
                            var msg = 'The app would exit immediately, please try login again after contacting to your system admin to get permission for the following objects in the org: ' + missMandatoryObjects.join(',');
                            deferred.reject(new Exception(EXCEPTION_SEVERITY.NON_RECOVERABLE, '403', msg));
                        } else {
                            deferred.resolve(filteredObjectTypes);
                        }
                    } else {
                        deferred.resolve(objectTypes);
                    }
                }, function (error) {
                    deferred.reject(error);
                });

                return deferred.promise;
            };

            /**
             * Remove existing queue message for the delted business object soup entry ids include all action(insert update and delete).
             *
             * @param   {String} targetObjectName the object type name
             * @param   {Array} _soupEntryIds      the soup entry id of the entry of the target object soup
             * @returns {Object}                  initialized queue message
             */
            var _removeExistingQueueMessagesForDeletedRecords = function (targetObjectName, _soupEntryIds) {
                var deferred = $q.defer();
                var queueSoup = SMARTSTORE_COMMON_SETTING.SOUP_NAME_QUEUE;

                var deletedQueueEntryIds = [];

                // building the query
                var smartSql = 'select {' + queueSoup + ':_soupEntryId} from {' + queueSoup + '} ';
                smartSql += 'where {' + queueSoup + ':objectName} = \'' + targetObjectName + '\' ';
                smartSql += 'and {' + queueSoup + ':recordSoupEntryId} in (' + _soupEntryIds.join(',') + ')';

                // building querySpec
                var querySpec = navigator.smartstore.buildSmartQuerySpec(smartSql, SMARTSTORE_COMMON_SETTING.PAGE_SIZE_FOR_ALL);

                // execute query reference object
                navigator.smartstore.runSmartQuery(false, querySpec, function (cursor) {

                    var currentPageEntries = cursor.currentPageOrderedEntries;

                    // iteration each gotten queue item
                    angular.forEach(currentPageEntries, function (queueItem) {
                        deletedQueueEntryIds.push(queueItem[0]);
                    });

                    if (deletedQueueEntryIds.length > 0) {
                        navigator.smartstore.removeFromSoup(queueSoup, deletedQueueEntryIds, function () {
                            deferred.resolve(true);
                        }, function (err) {
                            deferred.reject(err);
                        });
                    } else {
                        deferred.resolve(true);
                    }
                }, function (err) {
                    deferred.reject(err);
                });

                return deferred.promise;
            };

            /**
             * @description mount all referenced field informations
             * @param {string} objectType: Type of the object should be loaded (same as the soup-name)
             * @param {array} fieldNames: reference fields to do partial mount, if you want to mount all reference field, specify this parameter as null
             * @param {array} localEntries: the entry list of the object
             * @param {boolean} mountAllInfo: wheather to load the whole information of refered entity
             *
             * @returns an objects data with all references as "sub-Objects"
             **/
            var _mountSObjectReferenceEntities = function (objectType, fieldNames, localEntries, refer2EntityFieldNames2Load) {
                var deferred = $q.defer();

                var localEntrySoupEntryIds = [],
                    localEntrySoupEntryId2EntryMap = {},
                    refer2EntityFieldNames2LoadDefault = ['_soupEntryId', 'Id', 'Name'];

                angular.forEach(localEntries, function (localEntry) {
                    if (localEntrySoupEntryIds.indexOf(localEntry._soupEntryId) === -1) {
                        localEntrySoupEntryIds.push(localEntry._soupEntryId);
                    }
                    localEntrySoupEntryId2EntryMap[localEntry._soupEntryId] = localEntry;
                });

                // get field informations, resolve all reference fields
                service.getFieldInformations(objectType).then(function (fields) {
                    // resolve all reference field informations
                    var resolveReferenceFieldsPromises = [],
                        fieldReferToIndexMap = {},
                        index = 1, // 0 is the local entry id
                        referenceToObjectNames = [],
                        referenceToSidFieldNames = [],
                        referenceToObjectLoadedFieldNames = [],
                        referenceFields = [];

                    angular.forEach(fields, function (field) {
                        if (field.type === 'reference' && (fieldNames === null || (fieldNames.length && fieldNames.indexOf(field.name) > -1))) {
                            referenceFields.push(field);
                        }
                    });

                    // TODO: maybe need to imporve performance later,
                    // currently, use recursive method is because we use the same array to store reference types for a lookup field which might contain multiple sobject types.
                    var resolveReferToObjectNames = function (field) {
                        if (!field) {
                            if (referenceFields.length) {
                                resolveReferToObjectNames(referenceFields.pop());
                            } else {
                                deferred.resolve(localEntries);
                            }
                        } else {
                            var fieldName = field.name,
                                referenceTo = field.referenceTo,
                                referenceToFieldName = fieldName + SMARTSTORE_COMMON_SETTING.REFERENCED_FIELD_EXTENSION_SUFFIX;

                            service.resolveRefer2ExistingObjectNames(referenceTo).then(function (objNames) {
                                if (objNames && objNames.length) {
                                    fieldReferToIndexMap[fieldName] = {
                                        from: index
                                    };

                                    fieldReferToIndexMap[fieldName].referenceToInfo = {}

                                    var fieldNames2load = refer2EntityFieldNames2LoadDefault;
                                    var shouldLoadFields = refer2EntityFieldNames2Load === undefined ? undefined : refer2EntityFieldNames2Load[fieldName];
                                    if (shouldLoadFields && shouldLoadFields.length) {
                                        fieldNames2load = shouldLoadFields;
                                    }

                                    for (var j = 0; j < objNames.length; j++) {

                                        var currentObjectFieldNames2load = angular.copy(fieldNames2load);

                                        var referenceToObjectApiName = objNames[j];

                                        // Use Subject instead of Name for Case, Task and Event
                                        if (referenceToObjectApiName === 'Case' || referenceToObjectApiName === 'Task' || referenceToObjectApiName === 'Event') {
                                            currentObjectFieldNames2load = ['_soupEntryId', 'Id', 'Subject'];
                                        }

                                        if (referenceToObjectApiName === 'RecordType') {
                                            currentObjectFieldNames2load.push('DeveloperName');
                                        }
                                        fieldReferToIndexMap[fieldName].referenceToInfo[referenceToObjectApiName] = {
                                            from: index,
                                            fieldNames2load: currentObjectFieldNames2load
                                        };
                                        referenceToObjectLoadedFieldNames.push(currentObjectFieldNames2load);
                                        referenceToObjectNames.push(objNames[j]);
                                        referenceToSidFieldNames.push(referenceToFieldName);
                                        index += currentObjectFieldNames2load.length;
                                    }
                                    fieldReferToIndexMap[fieldName].to = index; // not include the to index value
                                }

                                if (referenceFields.length) {
                                    resolveReferToObjectNames(referenceFields.pop());
                                } else {
                                    if (!referenceToObjectNames.length) {
                                        deferred.resolve(localEntries);
                                    } else {

                                        // After all fields are analysed, the final sql query is generated, therefore, the query only run once.
                                        var querySql = '',
                                            selectSql = 'select r.{' + objectType + ':_soupEntryId},',
                                            joinSql = '',
                                            whereSql,
                                            fromSql = ' from {' + objectType + '} as r';

                                        if (localEntrySoupEntryIds.length) {
                                            whereSql = ' where r.{' + objectType + ':_soupEntryId} in (' + localEntrySoupEntryIds.join(',') + ') ';
                                        }

                                        for (var k = 0; k < referenceToObjectNames.length; k++) {
                                            var objName = referenceToObjectNames[k], rname = 'r' + k;

                                            var _fieldNames2load = referenceToObjectLoadedFieldNames[k];

                                            for (var m = 0; m < _fieldNames2load.length; m++) {
                                                var fieldName2load = _fieldNames2load[m];
                                                selectSql += ' ' + rname + '.{' + objName + ':' + fieldName2load + '},';
                                            }

                                            joinSql += ' left outer join {' + objName + '} as ' + rname;
                                            joinSql += ' on r.{' + objectType + ':' + referenceToSidFieldNames[k] + '} = ' + rname + '.{' + objName + ':_soupEntryId}';
                                        }

                                        querySql = selectSql.substring(0, selectSql.length - 1) + fromSql + joinSql;
                                        if (whereSql) {
                                            querySql += whereSql;
                                        }
                                        void 0;

                                        var querySpec = navigator.smartstore.buildSmartQuerySpec(querySql, SMARTSTORE_COMMON_SETTING.PAGE_SIZE_FOR_ALL);
                                        navigator.smartstore.runSmartQuery(querySpec, function (cursor) {
                                            if (cursor && cursor.currentPageOrderedEntries && cursor.currentPageOrderedEntries.length) {
                                                angular.forEach(cursor.currentPageOrderedEntries, function (aggragateResult) {
                                                    void 0;
                                                    var entryId = aggragateResult[0];
                                                    var localEntry = localEntrySoupEntryId2EntryMap[entryId];

                                                    for (var fieldName in fieldReferToIndexMap) {
                                                        if (fieldReferToIndexMap.hasOwnProperty(fieldName)) {
                                                            var fromIndex = fieldReferToIndexMap[fieldName].from,
                                                                toIndex = fieldReferToIndexMap[fieldName].to,
                                                                additionalValueKey = angular.copy(fieldName);
                                                            // convert additional value Key
                                                            if (_.endsWith(additionalValueKey, 'Id')) {
                                                                additionalValueKey = additionalValueKey.substring(0, additionalValueKey.length - 2);
                                                            } else if (_.endsWith(additionalValueKey, '__c')) {
                                                                additionalValueKey = additionalValueKey.substring(0, additionalValueKey.length - 1) + 'r';
                                                            }

                                                            var referenceToObjectName = localEntry[fieldName + SMARTSTORE_COMMON_SETTING.REFERENCED_FIELD_TYPE_SUFFIX];
                                                            if (referenceToObjectName && fieldReferToIndexMap[fieldName].referenceToInfo[referenceToObjectName]) {
                                                                var m = fieldReferToIndexMap[fieldName].referenceToInfo[referenceToObjectName].from;
                                                                var fieldNames2load = fieldReferToIndexMap[fieldName].referenceToInfo[referenceToObjectName].fieldNames2load;
                                                                var referToEntityFieldValues = aggragateResult.slice(m, m + fieldNames2load.length);
                                                                var referToEntity = {};
                                                                for (var n = 0; n < fieldNames2load.length; n++) {
                                                                    referToEntity[fieldNames2load[n]] = referToEntityFieldValues[n];
                                                                }
                                                                referToEntity.type = referenceToObjectName;
                                                                localEntry[additionalValueKey] = referToEntity;
                                                            }

                                                            // var m = fromIndex;
                                                            // while (m < toIndex) {
                                                            //
                                                            //     // Find correct type of the reference field if it supports multiple types like Owner(User, Group), Task.WhoId, etc.
                                                            //     if (referenceToObjectNames[(m - 1) / fieldNames2load.length] == localEntry[fieldName + SMARTSTORE_COMMON_SETTING.REFERENCED_FIELD_TYPE_SUFFIX]) {
                                                            //         var referToEntityFieldValues = aggragateResult.slice(m, m + fieldNames2load.length);
                                                            //         var referToEntity = {};
                                                            //         for (var n = 0; n < fieldNames2load.length; n++) {
                                                            //             referToEntity[fieldNames2load[n]] = referToEntityFieldValues[n];
                                                            //         }
                                                            //         referToEntity.type = localEntry[fieldName + SMARTSTORE_COMMON_SETTING.REFERENCED_FIELD_TYPE_SUFFIX];
                                                            //         localEntry[additionalValueKey] = referToEntity;
                                                            //     }
                                                            //
                                                            //     m += fieldNames2load.length;
                                                            // }
                                                        }
                                                    }
                                                });
                                            }

                                            deferred.resolve(localEntries);
                                        }, function (err) {
                                            void 0;
                                            deferred.reject(err);
                                        });
                                    }
                                }
                            }, function (error) {
                                deferred.reject(error);
                            });
                        }
                    };

                    resolveReferToObjectNames(referenceFields.pop());
                }, function (err) {
                    deferred.reject(err);
                });

                return deferred.promise;
            };

            service.getConfiguredObjectNames = function () {
                return $q(function (resolve, reject) {
                    var configuredObjects = ['RecordType'];
                    service.queryConfigurationAndObjects().then(function (configuration) {
                        angular.forEach(configuration.objects, function (obj) {
                            if (configuredObjects.indexOf(obj.Name) === -1) {
                                configuredObjects.push(obj.Name);
                            }
                        });

                        resolve(configuredObjects);
                    }, reject);
                });
            };

            /**
             * @description resolve oupnames in smartStore
             * @param {string array} objNames: soup name Array to check
             *
             * @returns string array - soup name Array that exist in smartstore
             **/
            service.resolveRefer2ExistingObjectNames = function (objNames) {
                return $q(function (resolve, reject) {
                    var results = [];

                    service.getConfiguredObjectNames().then(function (configuredObjectNames) {
                        if (configuredObjectNames && configuredObjectNames.length) {
                            angular.forEach(objNames, function (objName) {
                                if (configuredObjectNames.indexOf(objName) > -1 && results.indexOf(objName) === -1) {
                                    results.push(objName);
                                }
                            });
                        }

                        resolve(results);
                    }, reject);
                });
            };

            // cache local soups
            var localSoups = {};

            /**
             * @description check wheather the soup is exist in smartstore
             * @param {string} soupName: the soup name
             *
             * @returns boolean - ture stand for exist, false stand for not
             **/
            service.isSoupExist = function (soupName) {
                return $q(function (resolve, reject) {
                    if (soupName) {
                        if (localSoups[soupName]) {
                            resolve(localSoups[soupName]);
                        } else {
                            navigator.smartstore.soupExists(soupName, function (isSoupExists) {
                                localSoups[soupName] = isSoupExists;
                                resolve(localSoups[soupName]);
                            }, reject);
                        }
                    } else {
                        reject('LocalDataService.isSoupExist Error: missing parameter.');
                    }
                });
            };

            /**
             * @ngdoc method
             * @name getEntryByExactMatch
             * @methodOf oinio.core.service:LocalDataService
             * @description
             * load sobject from local soup
             *
             * @param {number} _soupEntryId: the _soupEntryId of the object which should be loaded
             * @param {string} objectType: Type of the object should be loaded (same as the soup-name)
             *
             * @returns entry of the object
             **/
            service.getEntryByExactMatch = function (objectType, path, matchKey) {
                var deferred = $q.defer();

                var querySpec = navigator.smartstore.buildExactQuerySpec(path, matchKey, 1);
                navigator.smartstore.querySoup(objectType, querySpec, function (cursor) {
                    var result = (cursor && cursor.currentPageOrderedEntries && cursor.currentPageOrderedEntries.length) ? cursor.currentPageOrderedEntries[0] : null;
                    deferred.resolve(result);
                }, function (err) {
                    deferred.resolve(null);
                });

                return deferred.promise;
            };

            /**
             * @description get reference entity information
             * @param {string} fieldName - relationship name
             * @param {string array} referenceTos - object name for load reference information
             * @param {string} referenceToId - reference id(sfdc id)
             *
             * @returns object: {Id: sfdcId, _soupEntryId: _soupEntryId, Name: referenceToRecordName}
             **/
            var _resolveReferenceField = function (fieldName, referenceTos, referenceToSoupEntryId) {
                var deferred = $q.defer();
                void 0;

                if (!referenceTos || !referenceToSoupEntryId || !fieldName || !(referenceTos instanceof Array)) {
                    deferred.reject('resolveReferenceField: Invalid parameters.');
                } else {
                    // check all referenced type to load the referenced entity
                    var checkReferencePromises = [],
                        reference2Entity;
                    angular.forEach(referenceTos, function (referenceToObject) {
                        var checkReferencePromise = service.getEntryByExactMatch(referenceToObject, '_soupEntryId', referenceToSoupEntryId).then(function (referenceToEntity) {
                            void 0;

                            if (referenceToEntity) {
                                var additionalValueKey = fieldName;

                                // convert additional value Key
                                if (_.endsWith(additionalValueKey, 'Id')) {
                                    additionalValueKey = additionalValueKey.substring(0, additionalValueKey.length - 2);
                                } else if (_.endsWith(additionalValueKey, '__c')) {
                                    additionalValueKey = additionalValueKey.substring(0, additionalValueKey.length - 1) + 'r';
                                }

                                reference2Entity = {
                                    name: additionalValueKey,
                                    body: {
                                        Id: referenceToEntity.Id,
                                        _soupEntryId: referenceToEntity._soupEntryId,
                                        Name: referenceToEntity.Name,
                                    },
                                };
                            }
                        }, function (error) {
                            deferred.reject(error);
                        });

                        checkReferencePromises.push(checkReferencePromise);
                    });

                    $q.all(checkReferencePromises).then(function () {
                        deferred.resolve(reference2Entity);
                    }, function (err) {
                        deferred.reject(err);
                    });
                }

                return deferred.promise;
            };

            /**
             * get the reference record according to salesforce id and referenceTo object types
             *
             * @param {string} id salesforce id of reference object
             * @param {Array} referenceTo eg: [ "Account", "Campaign", "Case", "Opportunity", "Product2", "Solution" ]
             * @param {boolean} [notFilterReferenceTo] If true search record from all referenceTo object,
             *                  otherwise deal with not exist soup(reference object) in this function.
             * @returns {*}
             */
            service.getReferenceRecordBySFId = function (id, referenceTo, notFilterReferenceTo) {

                return $q(function (resolve, reject) {
                    if (!id || !referenceTo || referenceTo.length === 0) {
                        reject();
                    } else {
                        var i = 0;

                        // iterate each reference object type in referenceTo array, find match salesforce id record.
                        var perProcess = function (objNames) {
                            service.getEntryByExactMatch(objNames[i], 'Id', id).then(function (referenceToEntity) {
                                if (referenceToEntity) {
                                    resolve(referenceToEntity);
                                } else {
                                    i++;
                                    if (i < objNames.length) {
                                        perProcess(objNames);
                                    } else {
                                        reject();
                                    }
                                }
                            }, reject);
                        };

                        if (notFilterReferenceTo) {
                            perProcess(referenceTo);
                        } else {
                            service.resolveRefer2ExistingObjectNames(referenceTo).then(function (newReferenceTo) {
                                perProcess(newReferenceTo);
                            }, reject);
                        }
                    }
                });
            };

            /**
             * @ngdoc method
             * @name getFieldInformations
             * @methodOf oinio.core.service:LocalDataService
             * @description
             * get object field informations
             *
             * @param {string} objectType - objectType to load the corresponding field informations
             *
             * @returns array with field informations {fieldname: fieldname, type: type, referenceTo: referenceTo, defaultValue: defaultValue, required: required, ....}
             **/
            service.getFieldInformations = function (objectType) {
                var deferred = $q.defer();

                if (objectType) {
                    if (fieldInformationsCache[objectType]) {
                        // load from cache
                        deferred.resolve(fieldInformationsCache[objectType]);
                    } else {

                        // // cache all configured object fields
                        // if (APP_SETTINGS.LOCAL_CONFIGURATION === true) {
                        //     console.log('>>>> load configuration from local file');
                        //     $http.get(APP_SETTINGS.LOCAL_CONFIGURATION_FILE).then(function (configurationContent) {
                        //         var localFields = [];
                        //         var localObjectType = _.findWhere(configurationContent.data, {name: objectType});
                        //
                        //         // Assume the localObjectType is existing
                        //         angular.forEach(localObjectType.fields, function (fieldName) {
                        //             localFields.push({name: fieldName});
                        //         });
                        //         deferred.resolve(localFields);
                        //     });
                        // }
                        // else {
                        void 0;

                        // load configuration from managed package (_configration and _object)
                        service.queryConfigurationAndObjects().then(function (configuration) {

                            // TODO: filter to exclude MobileVizArt__Active__c = false, or API name including Note, Attachment, Event and Task

                            var i = 0;
                            var parseConfiguration = function () {

                                // configuration objects is null, resolve [];
                                if (configuration.objects === undefined) {
                                    deferred.resolve(null);
                                    return;
                                }

                                if (i < configuration.objects.length) {
                                    var configObj = configuration.objects[i];

                                    // get the describe of this business object
                                    DescribeService.getDescribeSObject(configObj.Name).then(function (describeResult) {

                                        // TODO: User and Group also should sync down those fields according to configuration.
                                        var skipConfigurationObjects = ['MobileVizArt__Mobile_Configuration__c', 'MobileVizArt__Mobile_Object__c'];
                                        var syncedFields = configObj['MobileVizArt__Fields__c'].split(',');

                                        // get all fields for sync.
                                        var fields = [];
                                        angular.forEach(describeResult.fields, function (fieldItem) {

                                            // filter not necessary download fields of business objects which are exclude configuration objects
                                            if (syncedFields.indexOf(fieldItem.name) !== -1 || skipConfigurationObjects.indexOf(configObj.Name) !== -1) {
                                                fields.push(fieldItem);
                                            }
                                        });

                                        fieldInformationsCache[configObj.Name] = fields;

                                        i++;
                                        parseConfiguration();
                                    }, function (err) {
                                        deferred.reject(err);
                                    });
                                } else {
                                    deferred.resolve(fieldInformationsCache[objectType]);
                                }
                            };

                            parseConfiguration();
                        }, function (err) {

                            // TODO:
                            deferred.reject(err);
                        });
                        //}
                    }
                } else {
                    deferred.resolve(null);
                }

                return deferred.promise;
            };

            /**
             * get fields from configuration
             *
             * @param {string} objectType
             * @returns {Promise}
             */
            service.soqlFieldsForObjectType = function (objectType) {

                var deferred = $q.defer();

                service.getFieldInformations(objectType).then(function (fields) {
                    deferred.resolve(_.pluck(fields, 'name'));
                }, function (error) {
                    deferred.reject(error);
                });

                return deferred.promise;
            };

            /**
             * get records sum of special object in smartStore
             *
             * @param {string} objectType
             * @param {string} [filterCriteria] eg: "{Account:Id} is not null"
             * @returns {*|Promise}
             */
            service.getRecordsSumBySoup = function (objectType, filterCriteria) {
                var deferred = $q.defer();

                var smartSql = 'select count(*) from {' + objectType + '}';
                if (filterCriteria) {
                    smartSql += ' where ' + filterCriteria;
                }
                var querySpec = navigator.smartstore.buildSmartQuerySpec(smartSql);
                navigator.smartstore.runSmartQuery(querySpec, function (cursor) {
                    if (cursor.currentPageOrderedEntries && cursor.currentPageOrderedEntries.length == 1) {
                        deferred.resolve(cursor.currentPageOrderedEntries[0][0]);
                    } else {
                        deferred.reject(0);
                    }
                }, function (err) {
                    void 0;
                    deferred.reject(err);
                });

                return deferred.promise;
            };

            /**
             * get all records soup entry id array of special object in smartStore.
             *
             * @param {string} objectType
             * @param {string} [filterCriteria] eg: "{Account:Id} is not null"
             * @returns {*|Promise}
             */
            service.getAllRecordsSidBySoup = function (objectType, filterCriteria) {
                var deferred = $q.defer();

                var smartSql = 'select {' + objectType + ':_soupEntryId} from {' + objectType + '}';
                if (filterCriteria) smartSql += ' where ' + filterCriteria;
                var querySpec = navigator.smartstore.buildSmartQuerySpec(smartSql, SMARTSTORE_COMMON_SETTING.PAGE_SIZE_FOR_ALL);
                navigator.smartstore.runSmartQuery(querySpec, function (cursor) {
                    deferred.resolve(_.pluck(cursor.currentPageOrderedEntries, "0"));
                }, function (err) {
                    void 0;
                    deferred.reject(err);
                });

                return deferred.promise;
            };

            /**
             * get all records salesforce id array of special object in smartStore excluding null.
             *
             * @param {string} objectType
             * @param {string} [filterCriteria] eg: "{Account:Id} is not null"
             * @returns {*|Promise}
             */
            service.getAllRecordsSFIdBySoup = function (objectType, filterCriteria) {
                var deferred = $q.defer();

                var smartSql = 'select {' + objectType + ':Id} from {' + objectType + '} where {' + objectType + ':Id} is not null';
                if (filterCriteria) smartSql += ' and ' + filterCriteria;
                var querySpec = navigator.smartstore.buildSmartQuerySpec(smartSql, SMARTSTORE_COMMON_SETTING.PAGE_SIZE_FOR_ALL);
                navigator.smartstore.runSmartQuery(querySpec, function (cursor) {
                    deferred.resolve(_.pluck(cursor.currentPageOrderedEntries, "0"));
                }, function (err) {
                    void 0;
                    deferred.reject(err);
                });

                return deferred.promise;
            };

            /**
             * get all active records salesforce id array of special object in queue excluding null.
             *
             * @param {string} objectType
             * @param {string} [filterCriteria]
             * @returns {*|Promise}
             */
            service.getActiveRecordsSFIdBySoup = function (objectType, filterCriteria) {
                var queueSoup = SMARTSTORE_COMMON_SETTING.SOUP_NAME_QUEUE;
                var deferred = $q.defer();

                var smartSql = 'select {' + queueSoup + ':sfdcId} from {' + queueSoup + '} where {' + queueSoup + ':sfdcId} is not null and {' + queueSoup + ':objectName} = \'' + objectType + '\'';
                if (filterCriteria) smartSql += ' and ' + filterCriteria;
                var querySpec = navigator.smartstore.buildSmartQuerySpec(smartSql, SMARTSTORE_COMMON_SETTING.PAGE_SIZE_FOR_ALL);
                navigator.smartstore.runSmartQuery(querySpec, function (cursor) {
                    deferred.resolve(_.pluck(cursor.currentPageOrderedEntries, "0"));
                }, function (err) {
                    void 0;
                    deferred.reject(err);
                });

                return deferred.promise;
            };

            /**
             * get all active records sid array of special object in queue.
             *
             * @param {string} objectType
             * @param {string} [filterCriteria]
             * @returns {*|Promise}
             */
            service.getActiveRecordsSidBySoup = function (objectType, filterCriteria) {
                var queueSoup = SMARTSTORE_COMMON_SETTING.SOUP_NAME_QUEUE;
                var deferred = $q.defer();

                var smartSql = 'select {' + queueSoup + ':recordSoupEntryId} from {' + queueSoup + '} where {' + queueSoup + ':objectName} = \'' + objectType + '\'';
                if (filterCriteria) smartSql += ' and ' + filterCriteria;
                var querySpec = navigator.smartstore.buildSmartQuerySpec(smartSql, SMARTSTORE_COMMON_SETTING.PAGE_SIZE_FOR_ALL);
                navigator.smartstore.runSmartQuery(querySpec, function (cursor) {
                    deferred.resolve(_.pluck(cursor.currentPageOrderedEntries, "0"));
                }, function (err) {
                    void 0;
                    deferred.reject(err);
                });

                return deferred.promise;
            };

            /**
             * get records sid array of special object, which have not salesforce id.
             *
             * @param {string} objectType
             * @param {string} [filterCriteria]
             * @returns {*|Promise}
             */
            service.getNoIdRecordsSidBySoup = function (objectType, filterCriteria) {
                var deferred = $q.defer();

                var smartSql = 'select {' + objectType + ':_soupEntryId} from {' + objectType + '} where {' + objectType + ':Id} is null';
                if (filterCriteria) smartSql += ' and ' + filterCriteria;
                var querySpec = navigator.smartstore.buildSmartQuerySpec(smartSql, SMARTSTORE_COMMON_SETTING.PAGE_SIZE_FOR_ALL);
                navigator.smartstore.runSmartQuery(querySpec, function (cursor) {
                    deferred.resolve(_.pluck(cursor.currentPageOrderedEntries, "0"));
                }, function (err) {
                    void 0;
                    deferred.reject(err);
                });

                return deferred.promise;
            };

            /**
             * get records sid array of special object according to salesforce ids.
             *
             * @param {string} objectType
             * @param {Array} sfIds
             * @returns {*|Promise}
             */
            service.getRecordsSidBySFid = function (objectType, sfIds) {
                var deferred = $q.defer();

                var smartSql = 'select {' + objectType + ':_soupEntryId} from {' + objectType + '} where {' + objectType + ':Id} in (\'' + sfIds.join('\',\'') + '\')';
                var querySpec = navigator.smartstore.buildSmartQuerySpec(smartSql, SMARTSTORE_COMMON_SETTING.PAGE_SIZE_FOR_ALL);
                navigator.smartstore.runSmartQuery(querySpec, function (cursor) {
                    deferred.resolve(_.pluck(cursor.currentPageOrderedEntries, "0"));
                }, function (err) {
                    void 0;
                    deferred.reject(err);
                });

                return deferred.promise;
            };

            // ======================================================
            // Below are deprecated and test functions
            // ======================================================

            /**
             * Upsert records for a specific object type.
             * The function would create a queue message for each records by default.
             * If isLocalUpdate is true, then no queue message would be created.
             *
             * @deprecated
             *
             * @param   {String}  objectName    the object name of the records
             * @param   {Array}  records       the records to be upserted, they should be the same type of the specified object
             * @param   {Boolean} isLocalUpdate if this parameter is true, then no queue message would be created
             * @returns {Promise}                return upserted records
             */
            service.upsert = function (objectName, records, isLocalUpdate) {

                var deferred = $q.defer();

                // Upsert records
                navigator.smartstore.upsertSoupEntries(objectName, records, function (upsertedRecords) {

                    if (isLocalUpdate) {

                        // For local update, there is not need to create messages into queue
                        deferred.resolve(upsertedRecords);
                    } else {

                        // Once records are updated to SmartStore, they should also be added to queue if it is not only a local upsert
                        var messages = [];
                        _.each(upsertedRecords, function (upsertedRecord) {

                            // Initialize a new queue message
                            var message = service.initQueueMessage(objectName, upsertedRecord._soupEntryId, upsertedRecord.Id);

                            var originalRecord = _.findWhere(records, {_soupEntryId: upsertedRecord._soupEntryId});
                            if (originalRecord) {
                                // This is an update record
                                message.action = SMARTSTORE_COMMON_SETTING.QUEUE_MESSAGE_ACTION_UPDATE;
                            } else {
                                // This is an inserte record
                                message.action = SMARTSTORE_COMMON_SETTING.QUEUE_MESSAGE_ACTION_INSERT;
                            }

                            messages.push(message);
                        });

                        // Create and add messages to queue
                        service.saveQueueMessages(messages).then(function (result) {
                            deferred.resolve(upsertedRecords);
                        }, function (error) {
                            deferred.reject(error);
                        });
                    }
                }, function (error) {
                    deferred.reject(error);
                });

                return deferred.promise;
            };

            /**
             * Delete records for a specific object type.
             * The function would create a queue message for each records by default.
             * If isLocalUpdate is true, then no queue message would be created.
             *
             * @deprecated
             *
             * @param   {String}  objectName    the object name of the records
             * @param   {Array}  records       the records to be deleted, they should be the same type of the specified object
             * @param   {Boolean} isLocalDelete if this parameter is true, then no queue message would be created
             * @returns {Promise}                return success state
             */
            service.delete = function (objectName, records, isLocalDelete) {

                var deferred = $q.defer(),
                    entryIds = [];

                // Collect all entries' id
                _.each(records, function (record) {
                    entryIds.push(record._soupEntryId);
                });

                // Upsert records
                navigator.smartstore.removeFromSoup(objectName, entryIds, function (success) {

                    if (isLocalDelete) {

                        // For local delete, there is not need to create messages into queue
                        deferred.resolve(success);
                    } else {

                        // Find and remove those insert and update queue messages for these deleted records,
                        // because it doesn't make sense to keep insert or update messages for deleted records.
                        _removeExistingQueueMessagesForDeletedRecords(objectName, entryIds).then(function () {

                            // Once records are removed from SmartStore, those having sfdc id records should also be added to queue if it is not only a local delete
                            var messages = [];
                            _.each(records, function (deletedRecord) {

                                if (!deletedRecord.Id) {

                                    // This is a local new record, so no need to create queue message at all
                                    return;
                                } else {

                                    // This is an sfdc existing record, so need to create a queue message for sync
                                    // Initialize a new queue message
                                    var message = service.initQueueMessage(objectName, deletedRecord._soupEntryId, deletedRecord.Id);
                                    message.action = SMARTSTORE_COMMON_SETTING.QUEUE_MESSAGE_ACTION_DELETE;
                                    messages.push(message);
                                }
                            });

                            // Create and add messages to queue
                            if (messages.length) {
                                service.saveQueueMessages(messages).then(function () {
                                    deferred.resolve(true);
                                }, function (error) {
                                    deferred.reject(error);
                                });
                            } else {
                                deferred.resolve(true);
                            }
                        }, function (error) {
                            deferred.reject(error);
                        });

                    }
                }, function (error) {
                    deferred.reject(error);
                });

                return deferred.promise;
            };

            /**
             * Initial a queue message.
             *
             * @deprecated
             *
             * @param   {String} targetObjectName the object type name
             * @param   {String} soupEntryId      the soup entry id of the entry of the target object soup
             * @param   {String} sfdcId           the SFDC id of the entry
             * @returns {Object}                  initialized queue message
             */
            service.initQueueMessage = function (targetObjectName, soupEntryId, sfdcId) {
                return {
                    objectName: targetObjectName,
                    recordSoupEntryId: soupEntryId,
                    sfdcId: sfdcId,
                    state: null,
                    action: null,
                    error: null
                };
            };

            /**
             * Save a queue message, this is an upsert operation.
             *
             * @deprecated
             *
             * @param   {Array} messages the queue messages to be saved
             * @returns {Promise}
             */
            service.saveQueueMessages = function (messages) {
                var deferred = $q.defer();
                var queueSoup = SMARTSTORE_COMMON_SETTING.SOUP_NAME_QUEUE;

                var objectNames = [];
                var recordSoupEntryIds = [];
                var actions = [];

                angular.forEach(messages, function (message) {

                    if (objectNames.indexOf('\'' + message.objectName + '\'') === -1) {
                        objectNames.push('\'' + message.objectName + '\'');
                    }

                    if (recordSoupEntryIds.indexOf(message.recordSoupEntryId) === -1) {
                        recordSoupEntryIds.push(message.recordSoupEntryId);
                    }

                    if (actions.indexOf('\'' + message.action + '\'') === -1) {
                        actions.push('\'' + message.action + '\'');
                    }
                });

                // building the query
                var smartSql = 'select {' + queueSoup + ':_soup} from {' + queueSoup + '} ';
                smartSql += 'where {' + queueSoup + ':objectName} in (' + objectNames.join(',') + ') ';
                smartSql += 'and {' + queueSoup + ':recordSoupEntryId} in (' + recordSoupEntryIds.join(',') + ') ';
                smartSql += 'and {' + queueSoup + ':action} in (' + actions.join(',') + ')';

                // building querySpec
                var querySpec = navigator.smartstore.buildSmartQuerySpec(smartSql, SMARTSTORE_COMMON_SETTING.PAGE_SIZE_FOR_ALL);

                // execute query reference object
                navigator.smartstore.runSmartQuery(false, querySpec, function (cursor) {

                    var currentPageEntries = _.flatten(cursor.currentPageOrderedEntries);
                    var upsertedMessages = [];

                    // iteration each queue item
                    angular.forEach(messages, function (message) {

                        var filterCondition = {
                            objectName: message.objectName + '',
                            recordSoupEntryId: message.recordSoupEntryId,
                            action: message.action + ''
                        };

                        var originalQueue = _.where(currentPageEntries, filterCondition);

                        if (originalQueue) {

                            // This is an update record
                            originalQueue = originalQueue[0];
                            originalQueue.state = null;
                            originalQueue.error = null;
                            upsertedMessages.push(originalQueue);
                        } else {
                            upsertedMessages.push(message);
                        }

                    });

                    // Upsert queue messages
                    navigator.smartstore.upsertSoupEntries(SMARTSTORE_COMMON_SETTING.SOUP_NAME_QUEUE, upsertedMessages, function (upsertedMessages) {
                        deferred.resolve(upsertedMessages);
                    }, function (error) {
                        deferred.reject(error);
                    });

                }, function (err) {
                    deferred.reject(err);
                });

                return deferred.promise;
            };

            /**
             * Test method for initializing test data for sync up.
             * In the console, execute the following statement can run this function.
             * angular.element(document.body).injector().get("LocalDataService").initTestData();
             * TODO: This method is only for testing, and should not be called from anywhere in the app.
             * Later it should be removed and use unit test instead.
             */
            service.initTestData = function (initIndex, remoteExistSoupId, remoteSalesforceId, testIndex) {
                void 0;
                if (!initIndex) {
                    initIndex = [0];
                }
                if (!testIndex) {
                    testIndex = '';
                }

                var promises = [];

                if (initIndex.indexOf(0) !== -1) {

                    // insert single Account data.
                    var promise = service.upsert('Account', [{Name: 'LG Sync Up Single Added Account Test ' + testIndex}]);
                    promises.push(promise);
                } else if (initIndex.indexOf(1) !== -1) {

                    // insert Account and related Contact data.
                    var promise1 = service.upsert('Account', [{Name: 'LG Sync Up Unity Added Account Test ' + testIndex}]).then(function (upsertedRecord) {
                        var accEntryId = upsertedRecord[0]._soupEntryId;

                        service.upsert('Contact', [{
                            LastName: 'LG Sync Up Unity Added Contact Test ' + testIndex,
                            'AccountId_sid': accEntryId
                        },
                            {
                                LastName: 'LG Sync Up Second Unity Added Contact Test ' + testIndex,
                                'AccountId_sid': accEntryId
                            }]);
                    });
                    promises.push(promise1);
                } else if (initIndex.indexOf(2) !== -1) {

                    // insert Account data, then update it immediately in two times
                    var promise2 = service.upsert('Account', [{Name: 'LG Sync Up First Added Account Test ' + testIndex}]).then(function (upsertedRecord) {
                        upsertedRecord[0].Name = 'LG Sync Up First Updated Account Test ' + testIndex;

                        service.upsert('Account', upsertedRecord).then(function (newRecord) {
                            newRecord[0].Name = 'LG Sync Up Second Updated Account Test ' + testIndex;

                            service.upsert('Account', newRecord);
                        });
                    });
                    promises.push(promise2);
                } else if (initIndex.indexOf(3) !== -1) {

                    // insert one correct and incorrect Account data
                    var promise3 = service.upsert('Account', [{Name: 'LG Sync Up First Added Account Test ' + testIndex}, {Id: 'incorrectId'}]);
                    promises.push(promise3);
                } else if (initIndex.indexOf(4) !== -1 && remoteExistSoupId && remoteSalesforceId) {

                    // update remote exist Account data
                    var promise4 = service.upsert('Account', [{
                        Id: remoteSalesforceId,
                        _soupEntryId: remoteExistSoupId,
                        Name: 'LG Sync Up Updated Remote Exist Account Test ' + testIndex
                    }]);
                    promises.push(promise4);
                } else if (initIndex.indexOf(5) !== -1 && remoteExistSoupId && remoteSalesforceId) {

                    // delete remote exist Account data
                    var promise5 = service.delete('Account', [{
                        Id: remoteSalesforceId,
                        _soupEntryId: remoteExistSoupId
                    }]);
                    promises.push(promise5);
                } else if (initIndex.indexOf(6) !== -1 && remoteExistSoupId && remoteSalesforceId) {

                    // update remote exist Account data, then delete it
                    var promise6 = service.upsert('Account', [{
                        Id: remoteSalesforceId,
                        _soupEntryId: remoteExistSoupId,
                        Name: 'LG Sync Up Updated Remote Exist Account Test ' + testIndex
                    }])
                        .then(function () {

                            service.delete('Account', [{Id: remoteSalesforceId, _soupEntryId: remoteExistSoupId}]);
                        });
                    promises.push(promise6);
                } else if (initIndex.indexOf(7) !== -1) {

                    // insert Account data, then update it, then delete it
                    var promise7 = service.upsert('Account', [{Name: 'LG Sync Up First Added Account Test ' + testIndex}]).then(function (upsertedRecord) {
                        upsertedRecord[0].Name = 'LG Sync Up First Updated Account Test ' + testIndex;

                        service.upsert('Account', upsertedRecord).then(function (newRecord) {

                            service.delete('Account', newRecord);
                        });
                    });
                    promises.push(promise7);
                }

                $q.all(promises).then(function () {
                    void 0;
                });
            };

            service.testSqlQuery = function (sql, size) {
                var querySpec = navigator.smartstore.buildSmartQuerySpec(sql, size);
                navigator.smartstore.runSmartQuery(querySpec, function (cursor) {
                    void 0;
                }, function (err) {
                    void 0;
                });
            };

            service.testCUDActions = function () {
                return $q(function (resolve, reject) {
                    var testInsertAction = $q(function (innerResolve, innerReject) {
                        void 0;
                        service.saveSObjects('Contact', [
                            {
                                FirstName: 'aaa', LastName: 'bbb', Description: 'Will be delete by field filter'
                            }, {
                                FirstName: 'ccc', LastName: 'ddd', Description: 'Will be delete by field filter'
                            }
                        ]).then(function (result) {
                            void 0;
                            var expectQueueMessage1 = _initQueueMessage('Contact', result[0]._soupEntryId, null);
                            expectQueueMessage1.action = SMARTSTORE_COMMON_SETTING.QUEUE_MESSAGE_ACTION_INSERT;
                            var expectQueueMessage2 = _initQueueMessage('Contact', result[1]._soupEntryId, null);
                            expectQueueMessage2.action = SMARTSTORE_COMMON_SETTING.QUEUE_MESSAGE_ACTION_INSERT;
                            var sql = 'select {_queue:_soup} from {_queue}';
                            sql += ' where {_queue:objectName} = \'Contact\' and {_queue:recordSoupEntryId} in (' + result[0]._soupEntryId + ', ' + result[1]._soupEntryId + ')';
                            var querySpec = navigator.smartstore.buildSmartQuerySpec(sql);
                            navigator.smartstore.runSmartQuery(querySpec, function (cursor) {
                                var queueMessages, queueEntryIds = [];
                                if (cursor && cursor.currentPageOrderedEntries) {
                                    queueMessages = cursor.currentPageOrderedEntries;
                                }
                                void 0;
                                innerResolve([result[0]._soupEntryId, result[1]._soupEntryId]);
                            }, function (err) {
                                innerReject('verify queue message error: ' + JSON.stringify(err));
                            });
                        }, function (err) {
                            innerReject('test testInsertAction error: ' + JSON.stringify(err));
                        });
                    });

                    /*
                     var testUpdateAction = testInsertAction.then(function (contactEntryIds) {
                     return $q(function (innerResolve, innerReject){
                     console.log('begain to test update action: ' + JSON.stringify(contactEntryIds));

                     var updateEntry = [{
                     _soupEntryId: contactEntryIds[0],
                     FirstName: 'AAA',
                     LastName: 'BBB',
                     Description: 'Will be field filtered',
                     }, {
                     _soupEntryId: contactEntryIds[1],
                     FirstName: 'ccc',
                     LastName: 'DDD',
                     Description: 'Will be field filtered',
                     Id: 'fake sfdc id',
                     }];
                     service.updateSObjects('Contact', updateEntry).then(function (updatedRecords) {
                     console.log('updateSObjects result', JSON.stringify(updatedRecords));
                     var expectQueueMessage1 = _initQueueMessage('Contact', contactEntryIds[0], null);
                     expectQueueMessage1.action = SMARTSTORE_COMMON_SETTING.QUEUE_MESSAGE_ACTION_INSERT;
                     var expectQueueMessage2 = _initQueueMessage('Contact', contactEntryIds[1], null);
                     expectQueueMessage2.action = SMARTSTORE_COMMON_SETTING.QUEUE_MESSAGE_ACTION_UPDATE;
                     var sql = 'select {_queue:_soup} from {_queue}';
                     sql += ' where {_queue:objectName} = \'Contact\' and {_queue:recordSoupEntryId} in (' + contactEntryIds.join(',') + ')';
                     var querySpec = navigator.smartstore.buildSmartQuerySpec(sql);
                     navigator.smartstore.runSmartQuery(querySpec, function (cursor) {
                     var queueMessages, queueEntryIds = [];
                     if (cursor && cursor.currentPageOrderedEntries) {
                     queueMessages = cursor.currentPageOrderedEntries;
                     }
                     if (queueMessages) {
                     angular.forEach(queueMessages, function (queueMessage) {
                     queueEntryIds.push(queueMessage[0]._soupEntryId);
                     });
                     }
                     console.log('verify queue message, expect: ' + JSON.stringify([expectQueueMessage1, expectQueueMessage2]) + ' GET: ' + JSON.stringify(queueMessages));

                     // clear test data
                     console.log('begain to remove contact test data: ' + JSON.stringify(contactEntryIds));
                     navigator.smartstore.removeFromSoup('Contact', contactEntryIds, function (isRemoveContactTestDataOk) {
                     console.log('isRemoveContactTestDataOk ===> ' + isRemoveContactTestDataOk);
                     if (isRemoveContactTestDataOk === 'OK') {
                     console.log('remove test contact data: ', JSON.stringify(contactEntryIds));
                     console.log('begain to remove _queue test data: ' + JSON.stringify(queueEntryIds));
                     navigator.smartstore.removeFromSoup('_queue', queueEntryIds, function (isRemoveQueueTestDataOk) {
                     console.log('isRemoveQueueTestDataOk ===> ' + isRemoveQueueTestDataOk);
                     if (isRemoveQueueTestDataOk === 'OK') {
                     console.log('remove test _queue data: ', JSON.stringify(queueEntryIds));
                     innerResolve(true);
                     } else {
                     innerReject('Failed to remove test _queue data');
                     }
                     }, function (err) {
                     innerReject('remove test _queue data error: ' + JSON.stringify(err));
                     });
                     } else {
                     innerReject('Failed to remove test Contact data');
                     }
                     }, function (err) {
                     innerReject('remove test contact data error: ' + JSON.stringify(err));
                     });
                     }, function (err) {
                     innerReject('verify queue message error: ' + JSON.stringify(err));
                     });
                     }, function (err) {
                     innerReject('test updateSObjects error: ' + JSON.stringify(err));
                     });
                     });
                     });

                     testUpdateAction.then(function () {
                     console.log('begain to test delete action');
                     service.saveSObjects('Contact', [
                     {Id: 'fake sfdcId', FirstName: 'eee', LastName: 'fff', Description: 'Will be delete by field filter'},
                     {FirstName: 'EEE', LastName: 'FFF', Description: 'Will be delete by field filter'}
                     ]).then(function (result) {
                     console.log('test delete prepare data: ' + JSON.stringify(result));
                     var syncedRecord = result[0];
                     var notSyncedRecord = result[1];

                     service.deleteSObjects('Contact', result).then(function (deletedResult) {
                     navigator.smartstore.retrieveSoupEntries('Contact', [notSyncedRecord._soupEntryId], function (entries) {
                     console.log('verify delete unsynchronized record, expect 0, get: ', JSON.stringify(entries));
                     navigator.smartstore.retrieveSoupEntries('Contact', [syncedRecord._soupEntryId], function (entries) {
                     console.log('verify delete synchronized record, expect IsDeleted = true, get: ', JSON.stringify(entries));
                     var sql = 'select {_queue:_soup} from {_queue}';
                     sql += ' where {_queue:objectName} = \'Contact\' and {_queue:recordSoupEntryId} in (' + syncedRecord._soupEntryId + ', ' + notSyncedRecord._soupEntryId + ')';
                     var querySpec = navigator.smartstore.buildSmartQuerySpec(sql);
                     navigator.smartstore.runSmartQuery(querySpec, function (cursor) {
                     console.log('verify delete queue messages, expect one(entry id: ' + syncedRecord._soupEntryId + ') with delete action, get: ' + JSON.stringify(cursor.currentPageOrderedEntries));
                     });
                     });
                     });
                     }, function (err) {
                     console.log(err);
                     });
                     }, function (err) {
                     console.log(err);
                     });
                     }, function (err) {
                     console.log(err);
                     });
                     */
                });
            };

            // cache lookup configuration
            var _lookupconfig = [];

            /**
             * The local helper function readLookupConfig reads the lookupfilter.json file and caches the data in
             * _lookupconfig in the service.
             *
             * @returns {promise}               Array of read json file.
             */
            function readLookupConfig () {
                var deferred = $q.defer();
                // $http returns a promise, which has a then function, which also returns a promise
                $http.get('app/common/configuration/lookupfilter.json').success(function (response) {
                    _lookupconfig = (response.objects);
                    deferred.resolve(_lookupconfig);
                }).error(function (error, status){
                    deferred.reject('Error in function readLookupConfig(): ' + JSON.stringify({ message: error, status: status}));
                });
                return deferred.promise;
            }

            /**
             * The local helper function getLookupConfig searches in the array of lookup filter entries for an
             * objectType passed as parameter and returns a set of configurations in an array.
             *
             * @param   {String} objectType     The type of the object which the filter is for
             * @returns {Array}               Array of result records for the filter in promise
             */
            function getLookupConfig (objectType) {
                var tempLookupConfig = [];
                for( var i = 0 ; i < _lookupconfig.length ; i++ ){
                    if (_lookupconfig[i]['Name'] == objectType ) {
                        for( var j = 0 ; j < _lookupconfig[i]['lookupfilter'].length ; j++ ){
                            tempLookupConfig.push(_lookupconfig[i]['lookupfilter'][j]);
                        }
                    }
                }
                return tempLookupConfig;
            }

            /**
             * The function getFilterConfigByObjectType reads the lookup filter config from file and caches the
             * result in var _lookupconfig. It also returns the entries in an array of the passed objectType.
             *
             * @param   {String} objectType     The type of the object which the filter is for
             * @returns {promise}               Array of result records for the filter in promise
             */
            service.getFilterConfigByObjectType = function (objectType) {
                var deferred = $q.defer();
                var objectTypeLookupConfig;
                if (!_lookupconfig.length) {
                    readLookupConfig().then(function(){
                        objectTypeLookupConfig = getLookupConfig(objectType);
                        deferred.resolve(objectTypeLookupConfig);
                    });
                } else {
                    objectTypeLookupConfig = getLookupConfig(objectType);
                    deferred.resolve(objectTypeLookupConfig);
                }
                return deferred.promise;
            };

        });
})(angular, _);

(function (angular, _) {
    'use strict';

    /**
     * @ngdoc service
     * @name oinio.core.service:LocalSyncService
     * TODO Make named methods from anonymous methods
     * TODO reject with meaningful error messages
     * TODO Do NEVER use alerts in commited code!
     * TODO Use $log instead of console to output log messages
     * @description
     * TODO: description
     */
    angular.module('oinio.core')
        .service('LocalSyncService', function ($injector, $q, $log, $http, ConfigurationService, ForceClientService,
                                               LocalCacheService, APP_SETTINGS, MetaService, LocalDataService, DescribeService,
                                               SMARTSTORE_COMMON_SETTING, RecordTypeService, PicklistService,
                                               RestService, ConnectionMonitor, SalesforceDataService, FileService, SYNC_PAGE_SIZE) {
                var service = this;

                var Exception = $injector.get('Exception');
                var EXCEPTION_SEVERITY = $injector.get('EXCEPTION_SEVERITY');
                var PROCESS_CODE = $injector.get('PROCESS_CODE');
                var STATUS_CODE = $injector.get('STATUS_CODE');

                var isSyncingUp = false;
                var skipSyncDownObjects = ['Attachment', 'Note', 'Task', 'Event', 'ContentDocument', 'ContentVersion', 'ContentDocumentLink'];
                var skipCleanUpObjects = ['Attachment', 'Note', 'Task', 'Event', 'ContentDocument', 'ContentVersion', 'ContentDocumentLink'];

                /**
                 * Sync mobile / remote configuration, like MobileVizArt__Mobile_Configuration__c and MobileVizArt__Mobile_Object__c.
                 * Or load configuration from local.
                 *
                 * @returns {Promise}
                 */
                service.syncMobileConfiguration = function () {

                    var deferred = $q.defer();

                    if (APP_SETTINGS.LOCAL_CONFIGURATION === true) {
                        void 0;
                        $http.get(APP_SETTINGS.LOCAL_CONFIGURATION_FILE).then(function (configurationContent) {
                            var configurationData = configurationContent.data;

                            // trim some space between fields name of the configuration
                            if (configurationData.objects) {
                                for (var i = 0; i < configurationData.objects.length; i++) {
                                    var configObj = configurationData.objects[i];
                                    if (configObj['MobileVizArt__Fields__c'])
                                        configObj['MobileVizArt__Fields__c'] = configObj['MobileVizArt__Fields__c'].replace(new RegExp(/\s/g), '');
                                    if (configObj['MobileVizArt__Search_Fields__c'])
                                        configObj['MobileVizArt__Search_Fields__c'] = configObj['MobileVizArt__Search_Fields__c'].replace(new RegExp(/\s/g), '');
                                    if (configObj['MobileVizArt__List_Content_Fields__c'])
                                        configObj['MobileVizArt__List_Content_Fields__c'] = configObj['MobileVizArt__List_Content_Fields__c'].replace(new RegExp(/\s/g), '');
                                }
                            }

                            navigator.smartstore.upsertSoupEntriesWithExternalId('_configuration', [configurationData], 'Name', function (upsertedRecords) {
                                void 0;
                                service.syncConfiguredObjectsMeta().then(function (done) {
                                    deferred.resolve(done);
                                }, function (err) {
                                    deferred.reject(err);
                                });
                            }, function (err) {
                                deferred.reject(err);
                            });
                        }, function (error) {
                            deferred.reject(error);
                        });
                    } else {

                        // Prepare configuration objects for sync
                        service.prepareMobileConfigurationForSync().then(function (objectSyncWrapper) {

                            var configurationObjectNames = [];
                            angular.forEach(objectSyncWrapper.syncDownObjects.objectTypes, function (obj) {
                                configurationObjectNames.push(obj.name);
                            });

                            // Initialize metadata info (mainly last sync dates) for the configuration objects
                            MetaService.initializeMetaDataForObjectTypes(configurationObjectNames).then(function () {

                                // Start sync _configuration and _object based on the sync parameter
                                service.startSync(objectSyncWrapper).then(function (objectSyncResult) {

                                    service.syncConfiguredObjectsMeta(objectSyncWrapper).then(function (done) {
                                        deferred.resolve(objectSyncResult);
                                    }, function (err) {
                                        deferred.reject(err);
                                    });
                                }, function (err) {
                                    deferred.reject(err);
                                });

                            }, function (err) {
                                // error initializeMetaDataForObjectTypes
                                deferred.reject(err);
                            });

                        }, function (err) {
                            // prepareMobileConfigurationForSync error
                            deferred.reject(err);
                        });
                    }

                    return deferred.promise;
                };

                service.syncConfiguredObjectsMeta = function (objectSyncWrapper) {
                    var deferred = $q.defer();

                    // Query configuration and objects
                    void 0;
                    var _currentUser = LocalCacheService.get('currentUser');
                    LocalDataService.queryConfigurationAndObjects(_currentUser.ProfileId).then(function (configuration) {

                        // Update FilterCriteria in record synchronisation
                        _updateObjectFilterCriteria(configuration.objects).then(function (done) {
                                // create object type names array
                                var objectTypeNames = [];
                                angular.forEach(configuration.objects, function (obj) {
                                    objectTypeNames.push(obj.Name);
                                });

                                // synchronize objects CRUD permissions from sfdc
                                _localSyncSynchronizeObjectsPermissions({
                                    objs: configuration.objects,
                                    profileId: _currentUser.ProfileId,
                                    userId: _currentUser.Id
                                }).then(function (objectHasReadPermissions) {
                                        // filter object that has no read permission
                                        var filteredObjectTypeNames = [];
                                        if (objectHasReadPermissions && objectHasReadPermissions.length) {
                                            angular.forEach(objectTypeNames, function (objectName) {
                                                if (objectHasReadPermissions.indexOf(objectName) > -1 && filteredObjectTypeNames.indexOf(objectName) === -1) {
                                                    filteredObjectTypeNames.push(objectName);
                                                }
                                            });

                                            // Load describe for each sobject, including object attributes, record types, fields, picklist values, etc.
                                            DescribeService.loadDescribeSObjects(filteredObjectTypeNames).then(function (describeSObjectResults) {

                                                syncRecordTypes(describeSObjectResults).then(function () {
                                                    // Load describe layout for each sobject
                                                    DescribeService.loadDescribeLayouts(describeSObjectResults).then(function (describeLayoutResults) {

                                                        // Load picklists for every picklist fields of each sobject
                                                        PicklistService.loadAllPicklists(describeLayoutResults).then(function () {
                                                            deferred.resolve(true);
                                                        }, function (err) {
                                                            // error loadAllPicklists
                                                            void 0;
                                                            deferred.reject(err);
                                                        });
                                                    }, function (err) {
                                                        // error loadDescribeLayouts
                                                        deferred.reject(err);
                                                    });
                                                }, function (err) {
                                                    // error syncRecordTypes
                                                    deferred.reject(err);
                                                });
                                            }, function (err) {
                                                // error loadDescribeSObjects
                                                deferred.reject(err);
                                            });
                                        }
                                    },
                                    function (err) {
                                        void 0;
                                        deferred.reject(err);
                                    });
                            },
                            function (err) {
                                void 0;
                                deferred.reject(err);
                            });
                    }, function (err) {
                        // error queryConfigurationAndObjects
                        deferred.reject(err);
                    });

                    return deferred.promise;
                };

                /**
                 * Sync describe, layout, record types and picklists when language is changed.
                 *
                 * @returns {Promise}
                 */
                service.syncForLanguageChange = function () {

                    var deferred = $q.defer();

                    var handleError = function (error) {
                        if (error && typeof error.handle === 'function') {
                            error.retry = service.syncForLanguageChange;
                            error.deferred = deferred;
                            error.handle();
                        } else {
                            new Exception(EXCEPTION_SEVERITY.RECOVERABLE, error.status, error.message, error.stack, error, service.syncForLanguageChange, null, null, null, deferred).handle();
                        }
                        deferred.reject(error);
                    };

                    MetaService.getMetaValue('objectPermissions').then(function (objectPermissions) {

                        var filteredObjectTypeNames = [];
                        angular.forEach(objectPermissions, function (item, objectType) {
                            if (item['PermissionsRead'] === true) {
                                filteredObjectTypeNames.push(objectType);
                            }
                        });

                        // Load describe for each sobject, including object attributes, record types, fields, picklist values, etc.
                        DescribeService.loadDescribeSObjects(filteredObjectTypeNames, true).then(function (describeSObjectResults) {

                            syncRecordTypes(describeSObjectResults).then(function () {
                                // Load describe layout for each sobject
                                DescribeService.loadDescribeLayouts(describeSObjectResults).then(function (describeLayoutResults) {

                                    // Load picklists for every picklist fields of each sobject
                                    PicklistService.loadAllPicklists(describeLayoutResults).then(function () {
                                        deferred.resolve(true);
                                    }, function (err) {
                                        // error loadAllPicklists
                                        handleError(err);
                                    });
                                }, function (err) {
                                    // error loadDescribeLayouts
                                    handleError(err);
                                });
                            }, function (err) {
                                // error syncRecordTypes
                                handleError(err);
                            });
                        }, function (err) {
                            // error loadDescribeSObjects
                            handleError(err);
                        });

                    }, function (err) {
                        handleError(err);
                    });

                    return deferred.promise;
                };

                /**
                 * get objects CRUD permissions from SFDC by call apex rest: '/MobileVizArt/MobileVizArt/getObjectPermissions' and save to _meta: objectPermissions as key
                 * @param {object} options contains objs, userId, profileId as property
                 * @returns {Promise}
                 * @private
                 */
                function _localSyncSynchronizeObjectsPermissions(options) {
                    return $q(function (resolve, reject) {

                        var objectNames = [];

                        if (options && options.objs && options.objs.length) {
                            //collect all object names that involved by Lookup Mod Stamp
                            angular.forEach(options.objs, function (localObj) {

                                if (localObj) {
                                    // add object name
                                    objectNames.push(localObj.Name);

                                    // check LookupModStamp objects
                                    if (localObj['MobileVizArt__Lookup_Mod_Stamp__c'] && localObj['MobileVizArt__Lookup_Mod_Stamp__c'].length) {
                                        var objLookupModStampArr = localObj['MobileVizArt__Lookup_Mod_Stamp__c'].split(',');
                                        for (var i = 0; i < objLookupModStampArr.length; i++) {
                                            var lookupFieldName = objLookupModStampArr[i];

                                            // e.g.: Contact.Account.Name
                                            if (lookupFieldName.indexOf('.') > -1) {
                                                var cascadeFields = lookupFieldName.split('.');
                                                for (var j = 0; j < cascadeFields.length - 1; j++) {
                                                    var objName = cascadeFields[j];

                                                    // custom object: Contact.test_object__r.Name
                                                    if (_.endsWith(objName, '__r')) {
                                                        objName = objName.substring(0, objName.length - 1) + 'c';
                                                    }
                                                    if (objectNames.indexOf(objName) === -1) {
                                                        objectNames.push(objName);
                                                    }
                                                }
                                            } else {
                                                // Account
                                                if (objectNames.indexOf(lookupFieldName) === -1) {
                                                    objectNames.push(lookupFieldName);
                                                }
                                            }
                                        }
                                    }
                                }
                            });
                        }

                        // As the ProfileId is always available after using getUserInfo interface,
                        // there is no need to consider if ProfileId is not available even when "View Setup and Configuration" is false.
                        if (objectNames.length && options.userId && options.profileId) {
                            var postBody = {
                                userId: options.userId,
                                profileId: options.profileId,
                                objectNames: objectNames
                            };

                            RestService.getObjectPermissions(postBody).then(function (response) {
                                var objectPermissions = {}, objectHasReadPermissions = [];
                                if (response && 'list_ObjectPermission' in response && response['list_ObjectPermission'].length > 0) {
                                    angular.forEach(response['list_ObjectPermission'], function (item) {
                                        objectPermissions[item['SobjectType']] = item;
                                        if (item['PermissionsRead'] === true && objectHasReadPermissions.indexOf(item['SobjectType']) === -1) {
                                            objectHasReadPermissions.push(item['SobjectType']);
                                        }
                                    });
                                }

                                MetaService.setMetaValue('objectPermissions', objectPermissions).then(function () {
                                    resolve(objectHasReadPermissions);
                                }, reject);
                            }, reject);
                        } else {
                            resolve([]);
                        }
                    });
                }

                /**
                 * update local object filter criteria from sfdc by call apex rest: '/MobileVizArt/MobileVizArt/getFilterCriteria'
                 * @param {objects} objects to update filterCriterias
                 * @returns {*}
                 */
                function _updateObjectFilterCriteria(objects) {
                    return $q(function (resolve, reject) {
                        var objectSoupIds = [];

                        // collect all available object soup entry id for curent User
                        if (objects && objects.length) {
                            angular.forEach(objects, function (obj) {
                                if (obj['_soupEntryId'] && objectSoupIds.indexOf(obj['_soupEntryId']) === -1) {
                                    objectSoupIds.push(obj['_soupEntryId']);
                                }
                            });
                        }

                        // get the object schema and uodate filterCriterias
                        var query = 'select {_object:_soupEntryId}, {_object:_soup} from {_object} where {_object:_soupEntryId} in (' + objectSoupIds.join(',') + ') ';
                        var querySpec = navigator.smartstore.buildSmartQuerySpec(query, 200);
                        navigator.smartstore.runSmartQuery(querySpec, function (queryCursor) {
                            if (queryCursor && queryCursor.currentPageOrderedEntries && queryCursor.currentPageOrderedEntries.length > 0) {
                                var objects2upsert = [];

                                RestService.getFilterCriteria().then(function (filterCriteria) {
                                    $log.debug(filterCriteria);

                                    if (filterCriteria && filterCriteria['filterCriterias'] && filterCriteria['filterCriterias'].length) {
                                        var _filterCriteriasMap = {};
                                        angular.forEach(filterCriteria['filterCriterias'], function (item) {
                                            if (item['objName']) {
                                                _filterCriteriasMap[item['objName']] = item['filterCriteria'];
                                            }
                                        });

                                        angular.forEach(queryCursor.currentPageOrderedEntries, function (item) {
                                            var localObj = item[1];
                                            if (_filterCriteriasMap[localObj.Name] && localObj['MobileVizArt__Filter_Criteria__c'] !== _filterCriteriasMap[localObj.Name]) {
                                                localObj['MobileVizArt__Filter_Criteria__c'] = _filterCriteriasMap[localObj.Name];
                                                localObj['_soupEntryId'] = item[0];
                                                objects2upsert.push(localObj);
                                            }
                                        });

                                        if (objects2upsert.length) {
                                            navigator.smartstore.upsertSoupEntries('_object', objects2upsert, function (result) {
                                                $log.debug('finished update object filter criteria.');
                                                resolve(true);
                                            }, function (err) {
                                                $log.debug('update object filter criteria error', err);
                                                reject(err);
                                            });
                                        } else {
                                            resolve(true);
                                        }
                                    } else {
                                        resolve(true);
                                    }
                                }, reject);
                            } else {
                                resolve(true);
                                $log.debug('No records returned by query: ', query);
                            }
                        }, function (err) {
                            $log.debug('query local object with ' + querySpec + ' error', err);
                            reject(err);
                        });
                    });
                }

                /**
                 * synchronize RecordTypes from Salesforce based on describeSObjectResults
                 * @param {object} describeSObjectResults
                 * @returns {*}
                 */
                var syncRecordTypes = function (describeSObjectResults) {
                    var deferred = $q.defer();
                    var promises = [];

                    var recordTypeIds = [];
                    var dummyRecordTypeSobjectTypes = [];

                    angular.forEach(describeSObjectResults, function (describeSObjectResult) {
                        angular.forEach(describeSObjectResult.recordTypeInfos, function (recordTypeInfo) {
                            if (recordTypeInfo.available === true && recordTypeIds.indexOf(recordTypeInfo.recordTypeId) === -1) {
                                var recordTypeId = recordTypeInfo.recordTypeId;

                                // if record type is Master, note its sobject type, otherwise note its id for synchronization from salesforce
                                if (recordTypeId === '012000000000000AAA' && dummyRecordTypeSobjectTypes.indexOf(describeSObjectResult.name) === -1) {
                                    dummyRecordTypeSobjectTypes.push(describeSObjectResult.name);
                                } else {
                                    recordTypeIds.push(recordTypeId);
                                }
                            }
                        });
                    });

                    if (recordTypeIds.length > 0) {

                        // synchronization record type from salesforce
                        promises.push(RecordTypeService.syncDownAllRecordType(recordTypeIds));
                    }

                    if (dummyRecordTypeSobjectTypes.length > 0) {

                        // create and store dummy Master record types for related sobject types
                        promises.push(RecordTypeService.storeDummyRecordType(dummyRecordTypeSobjectTypes));
                    }

                    $q.all(promises).then(function () {
                        deferred.resolve(true);
                    }, function (error) {
                        deferred.reject(error);
                    });

                    return deferred.promise;
                };

                /**
                 * Sync business sobjects, including sync up, sync down, clean up.
                 * If it is local configuration, the business objects should be configured in common/configuration/xxx.json
                 * If it is mobile / remote configuration, the business objects are in _object soup.
                 *
                 * @param {Object} [option] the option is optional
                 * {
                 *     appInitialized: true, // (default is true if the option object is not passed, when true, it means to download IsDeleted=true records as well)
                 *     forceCleanup: true // (default is false if the option object is not passed, when true, it means to force a cleanup process even if the cleanup interval is not overdue)
                 * }
                 *
                 * @returns {Promise}
                 */
                service.syncBusinessSObjects = function (option) {

                    var deferred = $q.defer();

                    var handleError = function (error) {
                        if (error && typeof error.handle === 'function') {
                            error.retry = service.syncBusinessSObjects;
                            error.retryContext = service;
                            error.retryParam = [option];
                            error.retryDeferred = deferred;
                            error.handle();
                        } else {
                            new Exception(EXCEPTION_SEVERITY.RECOVERABLE, error.status, error.message, error.stack, error, service.syncBusinessSObjects, null, service, [option], deferred).handle();
                        }
                        deferred.reject(error);
                    };

                    service.prepareBusinessObjectTypeForSync().then(function (objectSyncWrapper) {

                        void 0;

                        if (option && option.appInitialized === false) {

                            // If app is not initialized, then no sync up and clean up are needed.
                            objectSyncWrapper.syncUpObjects.objectTypes = [];
                            objectSyncWrapper.cleanUpObjects.objectTypes = [];

                            // Set queryAll to false for each download object types
                            angular.forEach(objectSyncWrapper.syncDownObjects.objectTypes, function (objType) {
                                void 0;
                                objType.queryAll = false;
                            });
                        }

                        if (option && option.forceCleanup === true) {
                            objectSyncWrapper.cleanUpObjects.forceCleanup = true;
                        }

                        void 0;
                        service.startSync(objectSyncWrapper).then(function (result) {
                            deferred.resolve(result);
                        }, function (error) {
                            handleError(error);
                        }, function (process) {
                            deferred.notify(process);
                        });
                    }, function (error) {
                        handleError(error);
                    });

                    return deferred.promise;
                };

                /**
                 * Start sync, including sync up, sync down and clean up based on the parameters.
                 * This is the essential function for sync.
                 */
                service.startSync = function (objectSyncWrapper) {

                    var deferred = $q.defer();

                    $log.debug('>>>> start sync process beginning.');

                    // Start sync up
                    service.startSyncUpObjects(objectSyncWrapper).then(function (objectSyncResult) {

                        void 0;
                        $log.debug('>>>> sync up ended, start to sync down.');
                        deferred.notify(objectSyncResult);

                        // Start sync down
                        service.startSyncDownObjects(objectSyncWrapper).then(function (objectSyncResult) {

                            void 0;
                            $log.debug('>>>> sync down ended, start to clean up.');
                            deferred.notify(objectSyncResult);

                            // Start clean up
                            service.startCleanUpObjects(objectSyncWrapper).then(function (objectSyncResult) {

                                void 0;
                                $log.debug('>>>> clean up ended, start sync down file data.');
                                deferred.notify(objectSyncResult);

                                service.startSyncDownFileData().then(function () {

                                    $log.debug('>>>> start sync down attachment data.');
                                    service.startSyncDownAttachmentBody().then(function () {

                                        $log.debug('>>>> start rebuild reference.');

                                        // Start rebuild local reference
                                        service.startRebuildLocalReferenceForObjects(objectSyncWrapper).then(function (objectSyncResult) {

                                            void 0;
                                            $log.debug('>>>> rebuild reference ended, finished all sync process.');
                                            deferred.resolve(objectSyncResult);

                                        }, function (error) {

                                            deferred.reject(error);
                                        }, function (process) {

                                            //console.log('>>>> rebuild reference for objects processing status: ' + JSON.stringify(process));
                                            deferred.notify(process);
                                        });
                                    }, function (error) {

                                        deferred.reject(error);
                                    }, function (process) {

                                        //console.log('>>>> sync down attachment body processing status: ' + JSON.stringify(process));
                                        //deferred.notify(process);
                                    });
                                }, function (error) {

                                    deferred.reject(error);
                                }, function (process) {

                                    //console.log('>>>> sync down file version data processing status: ' + JSON.stringify(process));
                                    //deferred.notify(process);
                                });

                            }, function (error) {

                                deferred.reject(error);
                            }, function (process) {

                                //console.log('>>>> clean up objects processing status: ' + JSON.stringify(process));
                                deferred.notify(process);
                            });

                        }, function (error) {

                            deferred.reject(error);
                        }, function (process) {

                            //console.log('>>>> sync down objects processing status: ' + JSON.stringify(process));
                            deferred.notify(process);
                        });

                    }, function (error) {
                        deferred.reject(error);
                    }, function (process) {

                        //console.log('>>>> sync up objects processing status: ' + JSON.stringify(process));
                        deferred.notify(process);
                    });

                    return deferred.promise;
                };

                /**
                 * Function to rebuild local reference according to salesforce reference
                 *
                 * @param  {object} objects2rebuild names for which object to rebuild the local reference. if not specified, rebuild all objects.
                 *         Object name as key, soup entry id array as value
                 *         i.e.: {"Account": ["Account1soupEntryId", "Account1soupEntryId", ...], "Contact": ["Contact1soupEntryId1", "Contact1soupEntryId2", ...]}
                 * @param {boolean} updateAll flag if only empty fields should be update or all references should be restored
                 * @return Promise
                 */
                service.rebuildObjectRecordsLocalRef = function (objects2rebuild, updateAll) {
                    // console.log('start rebuild object reference for ');
                    // console.log(objects2rebuild);

                    var objs2rebuild = [];
                    if (objects2rebuild) {
                        for (var k in objects2rebuild) {
                            if (objects2rebuild.hasOwnProperty(k) && objs2rebuild.indexOf(k) === -1) {
                                objs2rebuild.push(k);
                            }
                        }
                    }

                    var deferred = $q.defer();

                    // get current user profile id from cache service.
                    var currentUser = LocalCacheService.get('currentUser');
                    if (!currentUser) {
                        deferred.reject('Failed to get current user information');
                    }

                    // get profile id
                    var profileId = currentUser['ProfileId'];

                    // load configuration from managed package (configration and object)
                    LocalDataService.queryConfigurationAndObjects(profileId).then(function (configuration) {
                        var checkSoupExistPromises = [], collectReferencePromises = [], linkObjectArr = [];

                        // Filter to exclude MobileVizArt__Active__c = false, or API name including Note, Attachment, Event and Task
                        function _isActiveObject(obj) {
                            var objects2filter = ['Note', 'Attachment', 'Event', 'Task'];
                            return obj && obj.Name && (obj['MobileVizArt__Active__c'] === true); //&& (objects2filter.indexOf(obj.Name) === -1);
                        }

                        LocalDataService.getConfiguredObjectNames().then(function (syncedObjects) {
                            angular.forEach(configuration.objects, function (obj) {

                                checkSoupExistPromises.push($q(function (resolve, reject) {

                                    $injector.get('SmartStoreService').checkSoupExist(obj.Name).then(function (exist) {

                                        var isCurrentObjShouldBeRebuild = _isActiveObject(obj) && (!objs2rebuild.length || (objs2rebuild.length && objs2rebuild.indexOf(obj.Name) > -1));
                                        if (!isCurrentObjShouldBeRebuild) {
                                            void 0;
                                        }

                                        if (exist && isCurrentObjShouldBeRebuild) {
                                            var specifiedSoupEntryIds = [];
                                            if (objects2rebuild && objects2rebuild[obj.Name] && objects2rebuild[obj.Name].length) {
                                                specifiedSoupEntryIds = objects2rebuild[obj.Name];
                                            }

                                            var linkObjectItem = {
                                                objectName: obj.Name,
                                                references: [],
                                                updateAll: updateAll,
                                                specifiedSoupEntryIds: specifiedSoupEntryIds
                                            }; // fields sync from sfdc
                                            var collectReferencePromise = LocalDataService.getFieldInformations(obj.Name).then(function (fields) {
                                                var referedEntity = {};

                                                // collect all reference fields
                                                angular.forEach(fields, function (field) {
                                                    if (field.type === 'reference') {
                                                        var fieldReferTo = field.referenceTo, fieldName = field.name;

                                                        // check whether the refered to object was synced down to local
                                                        for (var i = 0; i < fieldReferTo.length; i++) {
                                                            var referedToObjectName = fieldReferTo[i];
                                                            if (syncedObjects.indexOf(referedToObjectName) > -1) {
                                                                if (!referedEntity[referedToObjectName]) {
                                                                    referedEntity[referedToObjectName] = [fieldName];
                                                                }

                                                                if (referedEntity[referedToObjectName].indexOf(fieldName) === -1) {
                                                                    referedEntity[referedToObjectName].push(fieldName);
                                                                }
                                                            }
                                                        }
                                                    }
                                                });

                                                for (var k in referedEntity) {
                                                    if (referedEntity.hasOwnProperty(k)) {
                                                        linkObjectItem.references.push({
                                                            referencedObject: k,
                                                            fields: referedEntity[k],
                                                        });
                                                    }
                                                }

                                                if (linkObjectItem.references.length) {
                                                    linkObjectArr.push(linkObjectItem);
                                                }
                                            });

                                            collectReferencePromises.push(collectReferencePromise);
                                        }

                                        resolve();
                                    }, function (err) {

                                        void 0;
                                        reject(err);
                                    });
                                }));
                            });

                            $q.all(checkSoupExistPromises).then(function () {
                                void 0;
                                $q.all(collectReferencePromises).then(function () {
                                    void 0;
                                    void 0;
                                    if (linkObjectArr.length) {
                                        var chain = $q.when();
                                        angular.forEach(linkObjectArr, function (item, index) {
                                            chain = chain.then(chainFactory(item, (index === linkObjectArr.length - 1) ? true : false));
                                        });
                                    } else {
                                        deferred.resolve(true);
                                    }

                                    function chainFactory(item, theLastAction) {
                                        return function () {
                                            return _linkObjectsMulti(item.objectName, item.specifiedSoupEntryIds, item.references, item.updateAll).then(function (isDone) {
                                                void 0;
                                                void 0;
                                                if (theLastAction) {
                                                    deferred.resolve(true);
                                                }
                                            }, function (err) {
                                                void 0;
                                                deferred.reject(err);
                                            }, function (notify) {
                                                deferred.notify(notify);
                                            });
                                        };
                                    }
                                }, function (error) {
                                    deferred.reject(error);
                                });
                            }, function (err) {
                                deferred.reject(err);
                            });
                        }, function (err) {
                            deferred.reject(err);
                        });
                    }, function (err) {
                        deferred.reject(err);
                    });

                    return deferred.promise;
                };

                /**
                 * Function to test assigning internal references for the _soupEntryId
                 *
                 * @param {string} objectName name of the object soup we will have the lookup to the referenced object in it (in our sample: Contact)
                 * @param {string[]} specifiedSoupEntryIds _soupEntryId of the object soup we will have the lookup to the referenced object in it (in our sample: Contact)
                 * @param {json} references object array carries referenced fields information in form of an Array of objects:
                 *        ie: [{referencedObject: 'Account', fields:["ParentAccount", "Influencer__c"]}, {referencedObject: "User", fields:["OwnerId"],...}]
                 * @param {boolean} updateAll flag if only empty fields should be update or all references should be restored
                 */
                function _linkObjectsMulti(objectName, specifiedSoupEntryIds, references, updateAll) {
                    void 0;
                    var deferred = $q.defer();

                    // paging size for receiving all objects (2500 seemed to be a good compromise between performance and memory consumption)
                    var pageSize = SYNC_PAGE_SIZE.REBUILD_REFERENCE;
                    var sfdc2SoupIdMap = {};

                    var fieldsString = '';
                    var whereString = ' where ';

                    // build a list of fields to query and in parallel a where clause to check every field being empty
                    if (!updateAll) {
                        for (var i = 0; i < references.length; i++) {
                            for (var j = 0; j < references[i].fields.length; j++) {
                                if (!updateAll) {
                                    whereString += ' ({' + objectName + ':' + references[i].fields[j] +
                                        SMARTSTORE_COMMON_SETTING.REFERENCED_FIELD_EXTENSION_SUFFIX + '} is null) or';
                                }
                            }
                        }
                    }

                    // building the query
                    var query = 'select {' + objectName + ':_soupEntryId}, {' + objectName + ':_soup} from {' + objectName + '} ';

                    // add the where condition if needed
                    if (_.endsWith(whereString, 'or')) {
                        whereString = whereString.substring(0, whereString.length - 2);
                    }

                    if (specifiedSoupEntryIds && specifiedSoupEntryIds.length) {
                        if (whereString.trim() === 'where') {
                            whereString += ' {' + objectName + ':_soupEntryId} in (' + specifiedSoupEntryIds.join(',') + ')';
                        } else {
                            whereString += ' and {' + objectName + ':_soupEntryId} in (' + specifiedSoupEntryIds.join(',') + ')';
                        }
                    }

                    if (whereString.trim() !== 'where') {
                        query += whereString;
                    }

                    // by adding an order we prevent changing order by reorganization of database
                    query += ' order by {' + objectName + ':_soupEntryId} asc';

                    // building querySpec for receiving objects
                    var querySpec = navigator.smartstore.buildSmartQuerySpec(query, pageSize);

                    // console.log('build query spec for ' + objectName + '>>>>>>>>>>>>>> ');
                    // console.log(querySpec);

                    // execute objects query for the first time
                    navigator.smartstore.runSmartQuery(querySpec, queryPaging, function (err) {
                        if (err) {
                            void 0;
                        }

                        deferred.reject(err);
                    });

                    // result function for receiving and processing data, called from base function or internal by cursoring
                    // the fields in the currentPageOrderedEntries have the following order:
                    // first: the id of the object itself
                    // second: the first id for item of the reference.field-Array
                    // third: and so on
                    function queryPaging(cursor) {
                        //console.log('do paging Query');

                        function _closeCursor(cs, cb) {
                            navigator.smartstore.closeCursor(cs, function (result) {
                                cb(null);
                            }, function (err) {

                                cb(err);
                            });
                        }

                        if (cursor && cursor.currentPageOrderedEntries && cursor.currentPageOrderedEntries.length > 0) {
                            // array holding the reference sfdc Ids used for the Database Query. i.e.: {"Account": ["id1", "id2", ...], "User": ["id1", "id2", ...]}
                            var referencedSFDCIdMap = {};

                            // array holding the contact objects with the reference-Id as key
                            var objectSoupEntries = [];

                            // looping result for collect all sfdc refer Ids
                            for (var i = 0; i < cursor.currentPageOrderedEntries.length; i++) {
                                var __item = cursor.currentPageOrderedEntries[i];
                                var objectSoup = __item[1];
                                for (var j = 0; j < references.length; j++) {
                                    var ref = references[j], refObjName = ref.referencedObject;
                                    if (!referencedSFDCIdMap[refObjName]) {
                                        referencedSFDCIdMap[refObjName] = [];
                                    }

                                    for (var k = 0; k < ref.fields.length; k++) {
                                        var refId = objectSoup[ref.fields[k]];
                                        if (refId && referencedSFDCIdMap[refObjName].indexOf(refId) === -1) {
                                            referencedSFDCIdMap[refObjName].push(refId);
                                        }
                                    }
                                }
                            }

                            var collectRefPromises = [];

                            // console.log('referencedSFDCIdMap for ' + objectName + '>>>>>>>>>>>')
                            // console.log(referencedSFDCIdMap)

                            for (var refObjNameINMap in referencedSFDCIdMap) {
                                if (referencedSFDCIdMap.hasOwnProperty(refObjNameINMap) && referencedSFDCIdMap[refObjNameINMap].length) {
                                    (function (refObjNameINMap) {
                                        collectRefPromises.push($q(function (resolve, reject) {
                                            var joinSep = '\', \'';
                                            var innerQuery = ' select {' + refObjNameINMap + ':_soupEntryId}, {' + refObjNameINMap + ':Id} from {' + refObjNameINMap + '} ';
                                            innerQuery += ' where {' + refObjNameINMap + ':Id} in (\'' + referencedSFDCIdMap[refObjNameINMap].join(joinSep) + '\') ';
                                            innerQuery += ' order by {' + refObjNameINMap + ':_soupEntryId} asc';
                                            var innerQuerySpec = navigator.smartstore.buildSmartQuerySpec(innerQuery, pageSize);

                                            navigator.smartstore.runSmartQuery(innerQuerySpec, function (innerQueryCursor) {
                                                if (innerQueryCursor && innerQueryCursor.currentPageOrderedEntries && innerQueryCursor.currentPageOrderedEntries.length > 0) {
                                                    angular.forEach(innerQueryCursor.currentPageOrderedEntries, function (item) {
                                                        sfdc2SoupIdMap[item[1]] = {
                                                            _soupEntryId: item[0],
                                                            objectName: refObjNameINMap
                                                        };
                                                    });
                                                } else {
                                                    void 0;
                                                }

                                                _closeCursor(innerQueryCursor, function (err) {
                                                    if (err) {
                                                        reject(err);
                                                    } else {
                                                        void 0;
                                                        resolve(sfdc2SoupIdMap);
                                                    }
                                                });

                                            }, reject);
                                        }));
                                    }(refObjNameINMap));
                                }
                            }

                            $q.all(collectRefPromises).then(function () {
                                void 0;

                                var upsertObjects = [];
                                for (var i = 0; i < cursor.currentPageOrderedEntries.length; i++) {
                                    var __item = cursor.currentPageOrderedEntries[i];
                                    var objectSoup = __item[1];
                                    objectSoup._soupEntryId = __item[0]; // specify soupEntryId Fro upsert
                                    for (var j = 0; j < references.length; j++) {
                                        var ref = references[j], refObjName = ref.referencedObject;
                                        if (!referencedSFDCIdMap[refObjName]) {
                                            referencedSFDCIdMap[refObjName] = [];
                                        }

                                        for (var k = 0; k < ref.fields.length; k++) {
                                            var fieldName = ref.fields[k], refSFDCId = objectSoup[fieldName], refSoupEntry = sfdc2SoupIdMap[refSFDCId];
                                            if (refSoupEntry && refSoupEntry.objectName == refObjName) {
                                                objectSoup[fieldName + SMARTSTORE_COMMON_SETTING.REFERENCED_FIELD_EXTENSION_SUFFIX] = refSoupEntry._soupEntryId;
                                                objectSoup[fieldName + SMARTSTORE_COMMON_SETTING.REFERENCED_FIELD_TYPE_SUFFIX] = refObjName;
                                            }
                                        }
                                    }

                                    upsertObjects.push(objectSoup);
                                }

                                // notify update success
                                deferred.notify({
                                    total: cursor.totalEntries,
                                    size: cursor.currentPageOrderedEntries.length,
                                    objectName: objectName,
                                });

                                // updating the Objects with the reference-id
                                if (upsertObjects.length) {
                                    navigator.smartstore.upsertSoupEntries(objectName, upsertObjects, function (result) {
                                        void 0;

                                        // checking if there are more 'pages' to cursor
                                        if (cursor.currentPageIndex < cursor.totalPages - 1) {
                                            var newPageIndex = cursor.currentPageIndex + 1;

                                            // move on to next cursor
                                            void 0;
                                            navigator.smartstore.moveCursorToNextPage(cursor, queryPaging, function (err) {
                                                deferred.reject(err);
                                            });
                                        } else { // no more pages? Close Cursor
                                            _closeCursor(cursor, function (err) {
                                                if (err) {
                                                    deferred.reject(err);
                                                } else {
                                                    void 0;
                                                    deferred.resolve(true);
                                                }
                                            });
                                        }
                                    }, function (err) {
                                        void 0;
                                        _closeCursor(cursor, function (err) {
                                            if (err) {
                                                deferred.reject(err);
                                            } else {
                                                deferred.resolve(true);
                                            }
                                        });

                                        deferred.reject(err);
                                    });
                                } else {
                                    deferred.resolve(true);
                                }
                            }, function (error) {
                                deferred.reject(error);
                            });
                        } else {
                            void 0;
                            _closeCursor(cursor, function (err) {
                                if (err) {
                                    deferred.reject(err);
                                } else {
                                    deferred.resolve(true);
                                }
                            });
                        }
                    }

                    return deferred.promise;
                }

                /**
                 * Start sync down all configured objects determined by method getSyncDownObjects().
                 */
                service.startSyncDownObjects = function (objectSyncWrapper) {

                    void 0;

                    var deferred = $q.defer();

                    // Check to see if which object types are needed to sync
                    checkObjectTypesBeforeSynchronize(objectSyncWrapper.syncDownObjects.objectTypes).then(function () {

                        // If there is no sync down objects configured, return direclty
                        // TODO: check needSyncDown object types is 0 or not
                        if (!objectSyncWrapper.syncDownObjects || objectSyncWrapper.syncDownObjects.objectTypes.length === 0) {
                            deferred.resolve(objectSyncWrapper);
                            return deferred.promise;
                        }

                        RestService.getServerTimestamp().then(function (serverTimestamp) {
                                if (serverTimestamp) {
                                    angular.forEach(objectSyncWrapper.syncDownObjects.objectTypes, function (item) {
                                        item._serverTimestamp = serverTimestamp;
                                    });
                                }

                                var syncSequential = function (index) {
                                    if (index >= objectSyncWrapper.syncDownObjects.objectTypes.length) {

                                        // No more objects need to be processed.
                                        deferred.resolve(objectSyncWrapper);
                                    } else {
                                        // Current object type
                                        var objType = objectSyncWrapper.syncDownObjects.objectTypes[index];
                                        void 0;

                                        // Sync down records for current object type
                                        service.syncDownObjectRecords(objType).then(function (done) {

                                            // Update progress for normal sobjects
                                            if (objType !== undefined && skipSyncDownObjects.indexOf(objType.name) === -1) {

                                                // Process last page result
                                                var progressObj = objectSyncWrapper.syncDownObjects.syncProgress[objType.name];
                                                objectSyncWrapper.progress = progressObj;
                                                objectSyncWrapper.progress.status.processed += done.records;
                                                objectSyncWrapper.progress.status.total = done.total;
                                                objectSyncWrapper.progress.status.done = true;

                                                // Notify current status and start to sync next object
                                                deferred.notify(objectSyncWrapper);
                                            }

                                            // Update subsidiary records amount to first level ANTEs (Task, Event, Note and Attachment) and File (ContentDocument, ContentVersion, ContentDocumentLink)
                                            if (done['subsidiaryRecords'] && done['subsidiaryRecords'].length > 0) {
                                                for (var i = 0; i < done['subsidiaryRecords'].length; i++) {
                                                    var subProcessStatus = done['subsidiaryRecords'][i];

                                                    if (subProcessStatus['objectName'] === 'File') {

                                                        var notifyRelatedObject = function (fileRelatedObject) {
                                                            var subProgressObj = objectSyncWrapper.syncDownObjects.syncProgress[fileRelatedObject];
                                                            objectSyncWrapper.progress = subProgressObj;
                                                            subProgressObj.status = {
                                                                done: true,
                                                                total: subProgressObj.status.total + subProcessStatus['recordsOf' + fileRelatedObject],
                                                                processed: subProgressObj.status.processed + subProcessStatus['recordsOf' + fileRelatedObject]
                                                            };

                                                            deferred.notify(objectSyncWrapper);
                                                        };

                                                        notifyRelatedObject('ContentDocument');
                                                        notifyRelatedObject('ContentVersion');
                                                        notifyRelatedObject('ContentDocumentLink');
                                                    } else {
                                                        var subProgressObj = objectSyncWrapper.syncDownObjects.syncProgress[subProcessStatus['objectName']];
                                                        objectSyncWrapper.progress = subProgressObj;
                                                        subProgressObj.status = {
                                                            done: true,
                                                            total: subProgressObj.status.total + subProcessStatus['records'],
                                                            processed: subProgressObj.status.processed + subProcessStatus['records']
                                                        };

                                                        deferred.notify(objectSyncWrapper);
                                                    }
                                                }
                                            }

                                            void 0;

                                            syncSequential(index + 1);
                                        }, function (error) {
                                            deferred.reject(error);
                                        }, function (notify) {
                                            // Process each page result before last page
                                            var progressObj = objectSyncWrapper.syncDownObjects.syncProgress[objType.name];
                                            objectSyncWrapper.progress = progressObj;
                                            objectSyncWrapper.progress.status.processed += notify.records;
                                            objectSyncWrapper.progress.status.total = notify.total;

                                            deferred.notify(objectSyncWrapper);
                                        });
                                    }
                                };

                                // Start to sync the first object
                                syncSequential(0);
                            }, function (err) {
                                deferred.reject(err);
                            }
                        );

                    }, function (err) {

                        // TODO:
                        deferred.reject(err);
                    });

                    return deferred.promise;
                };

                /**
                 * Start sync up all objects based on the objectSyncWrapper.syncUpObjects.
                 *
                 * @param {object} objectSyncWrapper the method will sync up objects based on syncUpObjects property of the wrapper
                 */
                service.startSyncUpObjects = function (objectSyncWrapper) {

                    // Get all objects need to be synced up
                    //var objects = service.getSyncUpObjects();

                    var deferred = $q.defer();
                    var resolvedPromises = 0;

                    // If there is no sync up objects configured, return direclty
                    if (!objectSyncWrapper.syncUpObjects || objectSyncWrapper.syncUpObjects.objectTypes.length === 0) {
                        deferred.resolve(objectSyncWrapper);
                        return deferred.promise;
                    }

                    // TODO: job id? async deal multi request?
                    if (!isSyncingUp) {

                        isSyncingUp = true;

                        RestService.getServerTimestamp().then(function (serverTimestamp) {

                                if (serverTimestamp) {
                                    angular.forEach(objectSyncWrapper.syncUpObjects.objectTypes, function (item) {
                                        item._serverTimestamp = serverTimestamp;
                                    });
                                }

                                var syncSequential = function (index) {
                                    if (index >= objectSyncWrapper.syncUpObjects.objectTypes.length) {

                                        // All promises are resolved, then resolve the complete sync down process
                                        deferred.resolve(objectSyncWrapper);

                                        // Sycn up is finished, so reset flag
                                        isSyncingUp = false;

                                    } else {

                                        // Current object type
                                        var objType = objectSyncWrapper.syncUpObjects.objectTypes[index];
                                        void 0;

                                        // TODO: check objectType.needSyncUp

                                        // Sync up records for current object type
                                        service.syncUpObjectRecords(objType).then(function (done) {

                                            // Process last page result
                                            var progressObj = objectSyncWrapper.syncUpObjects.syncProgress[objType.name];
                                            if (done.operationType === SMARTSTORE_COMMON_SETTING.QUEUE_MESSAGE_ACTION_INSERT) {
                                                progressObj.status.inserted = done.processed;
                                                progressObj.status.insertFailed = done.failed;
                                                progressObj.status.insertTotal = done.total;
                                            } else if (done.operationType === SMARTSTORE_COMMON_SETTING.QUEUE_MESSAGE_ACTION_UPDATE) {
                                                progressObj.status.updated = done.processed;
                                                progressObj.status.updateFailed = done.failed;
                                                progressObj.status.updateTotal = done.total;
                                            } else if (done.operationType === SMARTSTORE_COMMON_SETTING.QUEUE_MESSAGE_ACTION_DELETE) {
                                                progressObj.status.deleted = done.processed;
                                                progressObj.status.deleteFailed = done.failed;
                                                progressObj.status.deleteTotal = done.total;
                                            }
                                            progressObj.status.done = true;

                                            void 0;

                                            // Notify current status and start to sync next object
                                            deferred.notify(objectSyncWrapper);
                                            syncSequential(index + 1);

                                        }, function (error) {
                                            isSyncingUp = false;
                                            deferred.reject(error);
                                        }, function (notify) {

                                            // Process each page result before last page
                                            var progressObj = objectSyncWrapper.syncUpObjects.syncProgress[objType.name];
                                            if (notify.operationType === SMARTSTORE_COMMON_SETTING.QUEUE_MESSAGE_ACTION_INSERT) {
                                                progressObj.status.inserted = notify.processed;
                                                progressObj.status.insertFailed = notify.failed;
                                                progressObj.status.insertTotal = notify.total;
                                            } else if (notify.operationType === SMARTSTORE_COMMON_SETTING.QUEUE_MESSAGE_ACTION_UPDATE) {
                                                progressObj.status.updated = notify.processed;
                                                progressObj.status.updateFailed = notify.failed;
                                                progressObj.status.updateTotal = notify.total;
                                            } else if (notify.operationType === SMARTSTORE_COMMON_SETTING.QUEUE_MESSAGE_ACTION_DELETE) {
                                                progressObj.status.deleted = notify.processed;
                                                progressObj.status.deleteFailed = notify.failed;
                                                progressObj.status.deleteTotal = notify.total;
                                            }

                                            // add successfully synced up records ids
                                            objType.syncUpSoupEntryIds = objType.syncUpSoupEntryIds || [];
                                            if (notify.successSoupEntryIds) {
                                                objType.syncUpSoupEntryIds = objType.syncUpSoupEntryIds.concat(notify.successSoupEntryIds);
                                            }

                                            deferred.notify(objectSyncWrapper);
                                        });
                                    }
                                };

                                // Start to sync the first object
                                syncSequential(0);
                            }, function (error) {
                                isSyncingUp = false;
                                deferred.reject(error);
                            }
                        );
                    } else {

                        // If the sync up is in processing, just return
                        angular.forEach(objectSyncWrapper.syncUpObjects.objectTypes, function (objType, index) {
                            objectSyncWrapper.syncUpObjects.syncProgress[objType.name].status.done = true;
                        });
                        deferred.resolve(objectSyncWrapper);
                    }

                    return deferred.promise;
                };

                /**
                 * Sync down records of a specific sobject from Salesforce
                 *
                 * @param {object} objectType
                 * @returns {*}
                 */
                service.syncDownObjectRecords = function (objectType) {

                    var deferred = $q.defer();

                    var syncSubObjectRecords = function (parentStatus) {

                        // Sync down subsidiary records which including Task, Event, Note, Attachment and File of this object
                        service.syncDownObjectSubsidiaryRecords(objectType).then(function (subDone) {

                            var processStatus = angular.copy(parentStatus);
                            processStatus.records = 0; // because the status has already been notified to parent logic, so clear it to avoid the record amount being calculated twice

                            // Sync down subsidiary records(Task, Event, Note, Attachment and File) process status
                            processStatus['subsidiaryRecords'] = subDone;

                            // Update last sync down date to local database
                            MetaService.updateLastSyncDownDate(objectType.name, objectType._serverTimestamp || new Date().toISOString()).then(function () {
                                //MetaService.updateLastSyncDownDate(objectType.name, new Date()).then(function () {
                                deferred.resolve(processStatus);
                            }, function (error) {
                                deferred.reject(error);
                            });
                        }, deferred.reject);
                    };

                    if (objectType !== undefined && skipSyncDownObjects.indexOf(objectType.name) === -1) {

                        // Get last sync down date from local database
                        MetaService.getObjectMetaByType(objectType.name).then(function (objMeta) {

                            // Set last sync down date from local database as parameters
                            if (objMeta && objMeta.lastSyncDownDate) {
                                objectType.lastSyncDownDate = objMeta.lastSyncDownDate;
                            }
                            void 0;

                            // Check if this object type is needed for syncing down, if not, notify and then sync subsidiary object
                            if (objectType.needSyncDown === false) {
                                void 0;

                                var result = {
                                    total: 0,
                                    records: 0
                                };
                                deferred.notify(result);
                                syncSubObjectRecords(result);
                            } else {

                                // Sync all records after last sync down date
                                synchronizeFromSFDC(objectType).then(function (done) {

                                    deferred.notify(done);
                                    syncSubObjectRecords(done);
                                }, deferred.reject, function (progress) {
                                    deferred.notify(progress);
                                });
                            }
                        }, deferred.reject);
                    } else {
                        deferred.resolve({
                            total: 0,
                            records: 0
                        });
                    }

                    return deferred.promise;
                };

                /**
                 * Sync down subsidiary records which including Task, Event, Note, Attachment and File of a specific sobject from Salesforce
                 *
                 * @param {object} param including these info as below:
                 *        {string} name specific target sobject type name
                 *        {string} lastSyncDownDate
                 *        {string} _serverTimestamp
                 * @returns {*}
                 */
                service.syncDownObjectSubsidiaryRecords = function (param) {

                    var objectName = param.name;
                    var lastSyncDownDate = param.lastSyncDownDate;
                    var serverTimestamp = param._serverTimestamp;

                    var deferred = $q.defer();

                    var promises = [];

                    // get target object configuration
                    LocalDataService.queryConfiguredObjectByName(objectName).then(function (objectType) {

                        if (objectType['MobileVizArt__Enable_NotesAndAttachments__c'] || objectType['MobileVizArt__Enable_Activity__c'] || objectType['MobileVizArt__Enable_File__c']) {

                            // soql string of query target object records salesforce id
                            var queryStr = generateSoqlForObject(param, 'Id');

                            // Whether setting is need to sync down Note and Attachment
                            if (objectType['MobileVizArt__Enable_NotesAndAttachments__c']) {

                                promises.push(syncDownSubsidiaryRecords(objectType, 'Attachment', queryStr, lastSyncDownDate, serverTimestamp));
                                promises.push(syncDownSubsidiaryRecords(objectType, 'Note', queryStr, lastSyncDownDate, serverTimestamp));
                            }

                            // Whether setting is need to sync down Task and Event
                            if (objectType['MobileVizArt__Enable_Activity__c']) {

                                promises.push(syncDownSubsidiaryRecords(objectType, 'Task', queryStr, lastSyncDownDate, serverTimestamp));
                                promises.push(syncDownSubsidiaryRecords(objectType, 'Event', queryStr, lastSyncDownDate, serverTimestamp));
                            }

                            // Whether setting is need to sync down File
                            if (objectType['MobileVizArt__Enable_File__c']) {

                                promises.push(syncDownSubsidiaryFileRecords(objectType, queryStr, lastSyncDownDate, serverTimestamp));
                            }

                            $q.all(promises).then(function (syncProcess) {
                                deferred.resolve(syncProcess);
                            }, deferred.reject);
                        } else {
                            deferred.resolve([]);
                        }
                    }, deferred.reject);

                    return deferred.promise;
                };

                /**
                 * Sync down specific subsidiary records which is one of Task, Event, Note and Attachment
                 *
                 * @param {object} objectType target related object type
                 * @param {string} subsidiaryObjectName one of Task, Event, Note and Attachment
                 * @param {string} queryStr target object salesforce Id query string
                 * @param {string} lastSyncDownDate
                 * @param {string} serverTimestamp
                 * @returns {Promise}
                 */
                var syncDownSubsidiaryRecords = function (objectType, subsidiaryObjectName, queryStr, lastSyncDownDate, serverTimestamp) {

                    var deferred = $q.defer();

                    // get subsidiary object configuration
                    ConfigurationService.getBusinessObjectTypeByName(subsidiaryObjectName).then(function (subsidiaryObjectType) {
                        if (subsidiaryObjectType) {
                            subsidiaryObjectType.lastSyncDownDate = lastSyncDownDate;
                            subsidiaryObjectType._serverTimestamp = serverTimestamp;

                            // generate sync down subsidiary records soql
                            generateSoqlForSyncDown(subsidiaryObjectType).then(function (soql) {

                                // add parent type filter according to target object type
                                if (soql.toLowerCase().indexOf(' where ') === -1) {
                                    soql += ' WHERE ';
                                } else {
                                    soql += ' AND ';
                                }

                                if (subsidiaryObjectName === 'Attachment' || subsidiaryObjectName === 'Note') {
                                    soql += 'ParentId IN (' + queryStr + ')';
                                } else {
                                    if (objectType.Name === 'Contact' || objectType.Name === 'Lead') {
                                        soql += 'WhoId IN (' + queryStr + ')';
                                    } else {
                                        soql += 'WhatId IN (' + queryStr + ')';
                                    }
                                }

                                // get all new delta subsidiary records including deleted records
                                SalesforceDataService.queryAll(soql, true).then(function (result) {
                                    var records2Upsert = [];
                                    var recordIds2Delete = [];

                                    var defaultBodySyncOnDemand = (objectType['MobileVizArt__Attachment_On_Demand__c'] === undefined
                                    || objectType['MobileVizArt__Attachment_On_Demand__c'] === null) ? true : objectType['MobileVizArt__Attachment_On_Demand__c'];
                                    var remainProperties = (subsidiaryObjectName === 'Attachment') ? ['_bodySynced', '_bodySyncOnDemand'] : undefined;
                                    for (var i = 0; i < result.length; i++) {
                                        var item = result[i];

                                        if (item.IsDeleted === true) {
                                            recordIds2Delete.push(item.Id);
                                        } else {
                                            if (subsidiaryObjectName === 'Attachment') {
                                                item['_bodySynced'] = false;
                                                item['_bodySyncOnDemand'] = defaultBodySyncOnDemand;
                                                item['ParentId_type'] = objectType.Name;
                                            }

                                            records2Upsert.push(item);
                                        }
                                    }

                                    // remove deleted records
                                    _localSyncRemoveFromSoup(subsidiaryObjectName, recordIds2Delete).then(function (removeDone) {
                                        void 0;
                                        // upsert records
                                        _localSyncUpsertSoupEntriesWithExternalId(subsidiaryObjectName, records2Upsert, remainProperties).then(function () {

                                            deferred.resolve({
                                                objectName: subsidiaryObjectName,
                                                records: result.length
                                            });
                                        }, deferred.reject);
                                    }, deferred.reject);
                                }, deferred.reject);
                            }, deferred.reject);
                        } else {
                            deferred.reject('SyncDownSubsidiaryRecords not found ' + subsidiaryObjectName + ' configuration.');
                        }
                    }, deferred.reject);

                    return deferred.promise;
                };

                /**
                 * Sync down subsidiary File records, including ContentDocumentLink, ContentDocument and ContentVersion records.
                 *
                 * @param {object} linkedObjectType linked object type
                 * @param {string} queryStr target object salesforce Id query string
                 * @param {string} lastSyncDownDate
                 * @param {string} serverTimestamp
                 * @returns {Promise}
                 */
                var syncDownSubsidiaryFileRecords = function (linkedObjectType, queryStr, lastSyncDownDate, serverTimestamp) {

                    var deferred = $q.defer();

                    var objectName = 'ContentDocumentLink';

                    // get subsidiary object configuration
                    ConfigurationService.getBusinessObjectTypeByName(objectName).then(function (contentDocumentLinkType) {
                        if (contentDocumentLinkType) {
                            contentDocumentLinkType.lastSyncDownDate = lastSyncDownDate;
                            contentDocumentLinkType._serverTimestamp = serverTimestamp;

                            // generate sync down subsidiary records soql
                            generateSoqlForSyncDown(contentDocumentLinkType).then(function (soql) {

                                // add LinkedEntityId filter according to target object salesforce Id
                                if (soql.toLowerCase().indexOf(' where ') === -1) {
                                    soql += ' WHERE ';
                                } else {
                                    soql += ' AND ';
                                }

                                soql += 'LinkedEntityId IN (' + queryStr + ')';

                                // get all new delta subsidiary records including deleted records
                                SalesforceDataService.queryAll(soql, true).then(function (result) {
                                    var records2Upsert = [];
                                    var recordIds2Delete = [];

                                    for (var i = 0; i < result.length; i++) {
                                        var item = result[i];

                                        if (item.IsDeleted === true) {
                                            recordIds2Delete.push(item.Id);
                                        } else {
                                            item['LinkedEntityId_type'] = linkedObjectType.Name;
                                            records2Upsert.push(item);
                                        }
                                    }

                                    // remove deleted records
                                    _localSyncRemoveFromSoup(objectName, recordIds2Delete).then(function (removeDone) {
                                        void 0;
                                        // upsert records
                                        _localSyncUpsertSoupEntriesWithExternalId(objectName, records2Upsert).then(function () {

                                            // sync down related contentDocument records, including contentVersion records.
                                            syncDownContentDocumentRecords(linkedObjectType, lastSyncDownDate, serverTimestamp).then(function (upsertedResult) {
                                                deferred.resolve({
                                                    objectName: 'File',
                                                    recordsOfContentDocument: upsertedResult.recordsOfContentDocument,
                                                    recordsOfContentVersion: upsertedResult.recordsOfContentVersion,
                                                    recordsOfContentDocumentLink: result.length
                                                });
                                            }, function (error) {
                                                deferred.reject(error);
                                            });
                                        }, deferred.reject);
                                    }, deferred.reject);
                                }, deferred.reject);
                            }, deferred.reject);
                        } else {
                            deferred.reject('syncDownSubsidiaryFileRecords not found ' + objectName + ' configuration.');
                        }
                    }, function (error) {
                        deferred.reject(error);
                    });

                    return deferred.promise;
                };

                /**
                 * Sync down ContentDocument records, including ContentVersion records.
                 *
                 * @param {object} linkedObjectType linked object type
                 * @param {string} lastSyncDownDate
                 * @param {string} serverTimestamp
                 * @returns {Promise}
                 */
                var syncDownContentDocumentRecords = function (linkedObjectType, lastSyncDownDate, serverTimestamp) {

                    var deferred = $q.defer();

                    var objectName = 'ContentDocument';

                    getAllContentDocumentIds(linkedObjectType.Name).then(function (contentDocumentIds) {

                        if (contentDocumentIds && contentDocumentIds.length > 0) {

                            // get subsidiary object configuration
                            ConfigurationService.getBusinessObjectTypeByName(objectName).then(function (contentDocumentType) {
                                if (contentDocumentType) {
                                    contentDocumentType.lastSyncDownDate = lastSyncDownDate;
                                    contentDocumentType._serverTimestamp = serverTimestamp;

                                    // generate sync down subsidiary records soql
                                    generateSoqlForSyncDown(contentDocumentType).then(function (soql) {

                                        // add Id filter
                                        if (soql.toLowerCase().indexOf(' where ') === -1) {
                                            soql += ' WHERE ';
                                        } else {
                                            soql += ' AND ';
                                        }

                                        soql += 'Id IN :list_id';

                                        service.syncDownRecordsByIds(objectName, contentDocumentIds, null, null, true, soql).then(function (result) {

                                            var upsertedContentDocumentIds = _.pluck(result, 'Id');

                                            // sync down contentVersion records
                                            syncDownContentVersionRecords(linkedObjectType, upsertedContentDocumentIds, lastSyncDownDate, serverTimestamp).then(function (contentVersions) {

                                                deferred.resolve({
                                                    recordsOfContentDocument: result.length,
                                                    recordsOfContentVersion: contentVersions.length
                                                });
                                            }, function (error) {
                                                deferred.reject('syncDownContentDocumentRecords error ' + JSON.stringify(error));
                                            });
                                        }, deferred.reject);
                                    }, deferred.reject);
                                } else {
                                    deferred.reject('syncDownContentDocumentRecords not found ' + objectName + ' configuration.');
                                }
                            }, deferred.reject);
                        } else {
                            deferred.resolve({
                                recordsOfContentDocument: 0,
                                recordsOfContentVersion: 0
                            });
                        }
                    }, function (error) {
                        deferred.reject(error);
                    });

                    return deferred.promise;
                };

                /**
                 * Sync down subsidiary ContentVersion records.
                 *
                 * @param {object} linkedObjectType linked object type
                 * @param {Array} relatedContentDocumentIds related contentDocument id array
                 * @param {string} lastSyncDownDate
                 * @param {string} serverTimestamp
                 * @returns {Promise}
                 */
                var syncDownContentVersionRecords = function (linkedObjectType, relatedContentDocumentIds, lastSyncDownDate, serverTimestamp) {

                    var deferred = $q.defer();

                    var objectName = 'ContentVersion';

                    if (relatedContentDocumentIds && relatedContentDocumentIds.length > 0) {

                        // get subsidiary object configuration
                        ConfigurationService.getBusinessObjectTypeByName(objectName).then(function (contentVersionType) {
                            if (contentVersionType) {
                                contentVersionType.lastSyncDownDate = lastSyncDownDate;
                                contentVersionType._serverTimestamp = serverTimestamp;

                                // generate sync down subsidiary records soql
                                generateSoqlForSyncDown(contentVersionType).then(function (soql) {

                                    // add ContentDocumentId filter according to target object salesforce id
                                    if (soql.toLowerCase().indexOf(' where ') === -1) {
                                        soql += ' WHERE ';
                                    } else {
                                        soql += ' AND ';
                                    }

                                    soql += 'ContentDocumentId IN :list_id ';

                                    var defaultVersionDataSyncOnDemand = (linkedObjectType['MobileVizArt__File_On_Demand__c'] === undefined
                                    || linkedObjectType['MobileVizArt__File_On_Demand__c'] === null) ? true : linkedObjectType['MobileVizArt__File_On_Demand__c'];

                                    var extendInfo = {
                                        _versionDataSynced: false,
                                        _versionDataSyncOnDemand: defaultVersionDataSyncOnDemand
                                    };

                                    service.syncDownRecordsByIds(objectName, relatedContentDocumentIds, extendInfo, '_versionDataSynced', true, soql).then(function (result) {
                                        deferred.resolve(result);
                                    }, function (error) {
                                        deferred.reject('syncDownContentVersionRecords error ' + JSON.stringify(error));
                                    });
                                }, deferred.reject);
                            } else {
                                deferred.reject('syncDownContentVersionRecords not found ' + objectName + ' configuration.');
                            }
                        }, deferred.reject);
                    } else {
                        deferred.resolve([]);
                    }

                    return deferred.promise;
                };

                /**
                 * Get all contentDocument Id from ContentDocumentLink, it can also be filtered by linked object type.
                 *
                 * @param {string} [linkedEntityType]
                 *
                 * @returns {Promise}
                 */
                var getAllContentDocumentIds = function (linkedEntityType) {
                    var deferred = $q.defer();

                    var queryContentDocumentIds = function (filterCriteria) {
                        var smartSql = 'select {ContentDocumentLink:ContentDocumentId} from {ContentDocumentLink} where {ContentDocumentLink:Id} is not null';
                        if (filterCriteria) {
                            smartSql += ' and ' + filterCriteria;
                        }

                        // building querySpec
                        var querySpec = navigator.smartstore.buildSmartQuerySpec(smartSql, SMARTSTORE_COMMON_SETTING.PAGE_SIZE_FOR_ALL);

                        // execute query reference object
                        navigator.smartstore.runSmartQuery(false, querySpec, function (cursor) {
                            deferred.resolve(_.pluck(cursor.currentPageOrderedEntries, "0"));
                        }, function (err) {
                            deferred.reject(err);
                        });
                    };

                    if (linkedEntityType) {
                        DescribeService.getKeyPrefix(linkedEntityType).then(function (linkObjectKeyPrefix) {
                            var filterCondition = '{ContentDocumentLink:LinkedEntityId} LIKE \'' + linkObjectKeyPrefix + '%\'';
                            queryContentDocumentIds(filterCondition);
                        }, function (error) {
                            deferred.reject(error);
                        });
                    } else {
                        queryContentDocumentIds();
                    }

                    return deferred.promise;
                };

                /**
                 * synchronize records from Salesforce
                 * @param {object} param
                 * @returns {*|b.promise|Function}
                 */
                var synchronizeFromSFDC = function (param) {

                    var objectType = param.name;
                    var nextRecordsUrl = param.nextRecordsUrl;
                    var done = param.done;
                    var deferred = param.deferred || $q.defer();
                    var forceClient = ForceClientService.getForceClient();
                    var soup = (param.targetSoup !== undefined && param.targetSoup !== '') ? param.targetSoup : objectType;
                    var queryAll = (param.queryAll === undefined) ? true : param.queryAll;

                    void 0;

                    // store data into smartStore. After stored, if have more data, call function synchronizeFromSFDC again.
                    var storeData = function (data) {
                        var records2Upsert = [];
                        var recordIds2Delete = [];
                        angular.forEach(data.records, function (item) {
                            if (item.IsDeleted === true) {
                                recordIds2Delete.push(item.Id);
                            } else {
                                records2Upsert.push(item);
                            }
                        });

                        // remove deleted records
                        _localSyncRemoveFromSoup(soup, recordIds2Delete).then(function (removeDone) {
                            void 0;
                            // upsert records
                            _localSyncUpsertSoupEntriesWithExternalId(soup, records2Upsert).then(function (upsertDone) {
                                void 0;
                                var result = {
                                    total: data.totalSize,
                                    records: data.records.length
                                };

                                if (data.done === false) {
                                    void 0;
                                    var nextParam = {
                                        name: objectType,
                                        targetSoup: param.targetSoup,
                                        nextRecordsUrl: data.nextRecordsUrl,
                                        done: data.done,
                                        deferred: deferred,
                                        queryAll: queryAll
                                    };

                                    deferred.notify(result);
                                    synchronizeFromSFDC(nextParam);
                                } else {
                                    void 0;
                                    deferred.resolve(result);
                                }
                            }, deferred.reject);
                        }, deferred.reject);
                    };

                    if (!nextRecordsUrl) {
                        generateSoqlForSyncDown(param).then(function (queryStr) {

                            if (queryAll === true) {
                                // use query all instead of query to get all records, include isDeteted=true records
                                forceClient.queryAll(queryStr, function (data) {
                                    $log.debug('>>>> success in query all');
                                    storeData(data);
                                }, function (error) {
                                    $log.warn(new Exception(null, error.status, error.message, error.stack, error));
                                    deferred.reject(error);
                                });
                            } else {
                                forceClient.query(queryStr, function (data) {
                                    $log.debug('>>>> success in query');
                                    storeData(data);
                                }, function (error) {
                                    $log.warn(new Exception(null, error.status, error.message, error.stack, error));
                                    deferred.reject(error);
                                });
                            }
                        }, function (error) {
                            error.method = 'local-sync.service::synchronizeFromSFDC->generateSoqlForSyncDown';
                            $log.debug(error);
                            deferred.reject(err);
                        });
                    } else if (nextRecordsUrl && !done) {
                        forceClient.queryMore(nextRecordsUrl, function (data) {
                            void 0;
                            storeData(data);
                        }, function (error) {
                            $log.warn(new Exception(null, error.status, error.message, error.stack, error));
                            deferred.reject(error);
                        });
                    }

                    return deferred.promise;
                };

                /**
                 * Start sync down file data(versionData) under the latest contentVersion
                 *
                 * Alternatively, if there are file ids are passed in the fucntion, then it would sync down the body of them no matter what the values of
                 * the filter fields are.
                 *
                 * @param   {Array} contentDocumentSids - specific content documents' ids for syncing down the bodys
                 * @returns {Promise}
                 */
                service.startSyncDownFileData = function (contentDocumentSids) {
                    var deferred = $q.defer();

                    // whether exist soup 'ContentVersion'
                    $injector.get('SmartStoreService').checkSoupExist('ContentVersion').then(function (exist) {
                        if (exist) {

                            // workaround for android smartstore boolean issue
                            var utilService = $injector.get('UtilService');
                            var isAndroid = utilService.isAndroidOS();

                            var booleanFalse = 0;
                            var booleanTrue = 1;

                            if (isAndroid) {
                                booleanFalse = '\'false\'';
                                booleanTrue = '\'true\'';
                            }

                            var smartSql;

                            if (contentDocumentSids && contentDocumentSids.length > 0) {

                                // Query specific content documents no matter what the values of the _body fields are
                                smartSql = 'select {ContentVersion:_soup} from {ContentVersion} where {ContentVersion:ContentDocumentId_sid} in (' + contentDocumentSids.join(',')
                                    + ') and {ContentVersion:IsLatest} = ' + booleanTrue + ' order by {ContentVersion:ContentDocumentId}, {ContentVersion:VersionNumber} desc';
                            } else {

                                // query all ContentVersion records whose '_versionDataSynced' field are not true and 'IsLatest' field is true.
                                smartSql = 'select {ContentVersion:_soup} from {ContentVersion} where {ContentVersion:Id} is not null and {ContentVersion:IsLatest} = ' + booleanTrue +
                                    ' and ({ContentVersion:_versionDataSynced} is null or {ContentVersion:_versionDataSynced} = ' + booleanFalse + ') and {ContentVersion:_versionDataSyncOnDemand} = ' + booleanFalse +
                                    ' order by {ContentVersion:ContentDocumentId}, {ContentVersion:VersionNumber} desc';
                            }
                            void 0;

                            var querySpec = navigator.smartstore.buildSmartQuerySpec(smartSql, SMARTSTORE_COMMON_SETTING.PAGE_SIZE_FOR_ALL);
                            navigator.smartstore.runSmartQuery(querySpec, function (cursor) {
                                var entries = cursor.currentPageOrderedEntries;

                                if (entries && entries.length > 0) {

                                    var contentVersionEntries = _.pluck(entries, 0);

                                    // sync down versionData of file
                                    syncDownFileData(contentVersionEntries).then(function (success) {
                                        deferred.resolve(success);
                                    }, function (error) {
                                        deferred.reject(error);
                                    }, function (process) {
                                        deferred.notify(process);
                                    });
                                } else {
                                    deferred.resolve({
                                        total: 0,
                                        processed: 0,
                                        failed: 0
                                    });
                                }
                            });
                        } else {
                            deferred.resolve({});
                        }
                    }, function (error) {
                        deferred.reject(error);
                    });

                    return deferred.promise;
                };

                /**
                 * Clean up all file records(including contentDocument and contentVersion)
                 * according to the cleaned ContentDocumentLink records.
                 *
                 * @returns {Promise}
                 */
                service.cleanUpAllContentDocument = function () {
                    var deferred = $q.defer();

                    var objectName = 'ContentDocument';

                    var cleanUpResult = {
                        objectName: objectName,
                        newVisiableRecords: 0,
                        dirtyRecords: 0
                    };

                    // clean local dirty contentDocument data in smartStore
                    var cleanLocalData = function (idsInLink, sidsInLink) {

                        // get active contentDocument record sid array in the queue
                        LocalDataService.getActiveRecordsSidBySoup('ContentDocument').then(function (activeSids) {

                            // query all contentDocument records in local smartStore
                            var smartSql = 'select {ContentDocument:_soupEntryId}, {ContentDocument:Id} from {ContentDocument}';
                            var querySpec = navigator.smartstore.buildSmartQuerySpec(smartSql, SMARTSTORE_COMMON_SETTING.PAGE_SIZE_FOR_ALL);
                            navigator.smartstore.runSmartQuery(querySpec, function (cursor) {
                                var entries = cursor.currentPageOrderedEntries;

                                var dirtySids = [];
                                var cleanedIds = [];
                                var cleanedSids = [];

                                // filter to get dirty contentDocument records and cleaned contentDocument records
                                for (var i = 0; i < entries.length; i++) {
                                    var sid = entries[i][0] + '';
                                    var id = entries[i][1];

                                    if (sid && sidsInLink.indexOf(sid) === -1 && activeSids.indexOf(parseInt(sid)) === -1 && idsInLink.indexOf(id) === -1) {
                                        dirtySids.push(sid);
                                    } else {
                                        if (id && cleanedIds.indexOf(id) === -1) {
                                            cleanedIds.push(id);
                                        }

                                        if (cleanedSids.indexOf(sid) === -1) {
                                            cleanedSids.push(sid);
                                        }
                                    }
                                }

                                // clear file data before deleting dirty contentDocument records
                                clearSubsidiaryRecordsFileData(objectName, dirtySids).then(function () {

                                    navigator.smartstore.removeFromSoup(false, objectName, dirtySids, function () {
                                        cleanUpResult.dirtyRecords = dirtySids.length;

                                        // clean up all contentVersion records according to the cleaned contentDocument records
                                        cleanUpAllContentVersion(cleanedIds, cleanedSids).then(function (cleanUpContentVersionResult) {
                                            deferred.resolve([cleanUpResult, cleanUpContentVersionResult]);
                                        }, function (error) {
                                            deferred.reject(error);
                                        });
                                    }, function (error) {
                                        deferred.reject(error);
                                    });
                                }, function (error) {
                                    deferred.reject(error);
                                });
                            });
                        }, function (error) {
                            deferred.reject(error);
                        });

                    };

                    // get all contentDocument salesforce id array according to the cleaned contentDocumentLink records in smartStore
                    getAllContentDocumentIds().then(function (allIds) {

                        // get all local exist contentDocument salesforce id array
                        LocalDataService.getAllRecordsSFIdBySoup(objectName).then(function (localSfIds) {

                            // filter to get new visible contentDocument records id array
                            var newVisibleIds = _.difference(allIds, localSfIds);

                            // sync down new visible contentDocument records by their salesforce id
                            service.syncDownRecordsByIds(objectName, newVisibleIds).then(function () {
                                cleanUpResult.newVisiableRecords = newVisibleIds.length;

                                // query all linked contentDocument id and soup id according to the cleaned contentDocumentLink records in smartStore
                                var smartSql = 'select {ContentDocumentLink:ContentDocumentId}, {ContentDocumentLink:ContentDocumentId_sid} from {ContentDocumentLink}';
                                var querySpec = navigator.smartstore.buildSmartQuerySpec(smartSql, SMARTSTORE_COMMON_SETTING.PAGE_SIZE_FOR_ALL);
                                navigator.smartstore.runSmartQuery(querySpec, function (cursor) {

                                    var entries = cursor.currentPageOrderedEntries;
                                    var idsInLink = [];
                                    var sidsInLink = [];

                                    for (var i = 0; i < entries.length; i++) {
                                        var item = entries[i];

                                        if (item[0] && idsInLink.indexOf(item[0]) === -1) {
                                            idsInLink.push(item[0]);
                                        }

                                        if (item[1] && sidsInLink.indexOf(item[1]) === -1) {
                                            sidsInLink.push(item[1]);
                                        }
                                    }

                                    // clean dirty contentDocument records excluding linked contentDocument and queue
                                    cleanLocalData(idsInLink, sidsInLink);
                                });

                            }, function (error) {
                                deferred.reject(error);
                            });
                        }, function (error) {
                            deferred.reject(error);
                        });
                    }, function (error) {
                        deferred.reject(error);
                    });

                    return deferred.promise;
                };

                /**
                 * Clean up all ContentVersion records according to the cleaned ContentDocument records
                 *
                 * @param   {Array} contentDocumentIds - contentDocument records id array
                 * @param   {Array} contentDocumentSids - contentDocument records soup id array
                 *
                 * @returns {Promise}
                 */
                var cleanUpAllContentVersion = function (contentDocumentIds, contentDocumentSids) {

                    var deferred = $q.defer();

                    var objectName = 'ContentVersion';

                    var cleanUpResult = {
                        objectName: objectName,
                        newVisiableRecords: 0,
                        dirtyRecords: 0
                    };

                    // clean local dirty contentVersion records whose related contentDocument is out of the cleaned contentDocument records
                    var cleanLocalData = function () {

                        // query local all contentVersion records in smartStore
                        var smartSql = 'select {ContentVersion:_soupEntryId}, {ContentVersion:ContentDocumentId}, {ContentVersion:ContentDocumentId_sid} from {ContentVersion}';
                        var querySpec = navigator.smartstore.buildSmartQuerySpec(smartSql, SMARTSTORE_COMMON_SETTING.PAGE_SIZE_FOR_ALL);
                        navigator.smartstore.runSmartQuery(querySpec, function (cursor) {
                            var entries = cursor.currentPageOrderedEntries;

                            var dirtySids = [];

                            // filter the dirty contentVersion records whose related contentDocument is out of the cleaned contentDocument records
                            for (var i = 0; i < entries.length; i++) {
                                var sid = entries[i][0];
                                var contentDocumentId = entries[i][1];
                                var contentDocumentSid = entries[i][2];

                                if (contentDocumentSids.indexOf(contentDocumentSid) === -1 && contentDocumentIds.indexOf(contentDocumentId) === -1) {
                                    dirtySids.push(sid);
                                }
                            }

                            // remove dirty contentVersion records in smartStore
                            navigator.smartstore.removeFromSoup(false, objectName, dirtySids, function () {
                                cleanUpResult.dirtyRecords = dirtySids.length;

                                deferred.resolve(cleanUpResult);
                            }, function (error) {
                                deferred.reject(error);
                            });

                        });
                    };

                    // get ContentVersion object configuration
                    ConfigurationService.getBusinessObjectTypeByName(objectName).then(function (contentVersionType) {
                        if (contentVersionType) {

                            // generate sync down contentVersion salesforce Id soql
                            var soql = generateSoqlForObject(contentVersionType, 'Id');

                            // add the cleaned ContentDocumentId filter
                            if (soql.toLowerCase().indexOf(' where ') === -1) {
                                soql += ' WHERE ';
                            } else {
                                soql += ' AND ';
                            }

                            soql += 'ContentDocumentId IN :list_id ';

                            // query all contentVersion salesforce id according to the related cleaned contentDocument ids
                            service.syncDownRecordsByIds(objectName, contentDocumentIds, null, null, true, soql, true).then(function (result) {

                                var allIds = _.pluck(result, 'Id');

                                // get all local exist contentVersion salesforce id array
                                LocalDataService.getAllRecordsSFIdBySoup(objectName).then(function (localSfIds) {

                                    // filter to get new visible contentVersion id array
                                    var newVisibleIds = _.difference(allIds, localSfIds);

                                    // sync down new visible contentVersion records by salesforce ids
                                    service.syncDownRecordsByIds(objectName, newVisibleIds, null, null, true).then(function (newVisibleRecords) {

                                        cleanUpResult.newVisiableRecords = newVisibleIds.length;

                                        resetSyncFileOnDemand(newVisibleRecords).then(function () {

                                            // delete these local records which are not exist or can't be accessed in salesforce, and not active in queue
                                            _removeDirtyRecords(objectName, _.difference(localSfIds, allIds)).then(function () {

                                                // clean local dirty contentVersion records whose related contentDocument is out of the cleaned contentDocument records
                                                cleanLocalData();
                                            }, function (error) {
                                                deferred.reject('cleanUpAllContentVersion error ' + JSON.stringify(error));
                                            });
                                        }, function (error) {
                                            deferred.reject('cleanUpAllContentVersion error ' + JSON.stringify(error));
                                        });
                                    }, function (error) {
                                        deferred.reject('cleanUpAllContentVersion error ' + JSON.stringify(error));
                                    });
                                }, function (error) {
                                    deferred.reject(error);
                                });
                            }, function (error) {
                                deferred.reject('cleanUpAllContentVersion error ' + JSON.stringify(error));
                            });
                        } else {
                            deferred.reject('cleanUpAllContentVersion not found ' + objectName + ' configuration.');
                        }
                    }, function (error) {
                        deferred.reject(error);
                    });

                    return deferred.promise;
                };

                /**
                 * Reset the field '_versionDataSyncOnDemand' value of contentVersion records according to file linked entry configuration 'MobileVizArt__File_On_Demand__c'
                 *
                 * @param   {Array} contentVersionRecords - contentVersion records array
                 * @returns {Promise}
                 */
                var resetSyncFileOnDemand = function (contentVersionRecords) {

                    var deferred = $q.defer();

                    if (!contentVersionRecords || contentVersionRecords.length === 0) {
                        deferred.resolve(true);
                    }

                    var contentDocumentIds = _.pluck(contentVersionRecords, 'ContentDocumentId');

                    var smartSql = 'Select {ContentDocumentLink:ContentDocumentId}, {ContentDocumentLink:LinkedEntityId} From {ContentDocumentLink} Where {ContentDocumentLink:ContentDocumentId} is not null' +
                        ' and {ContentDocumentLink:ContentDocumentId} in (\'' + contentDocumentIds.join('\',\'') + '\') order by {ContentDocumentLink:LinkedEntityId} asc';
                    var querySpec = navigator.smartstore.buildSmartQuerySpec(smartSql, SMARTSTORE_COMMON_SETTING.PAGE_SIZE_FOR_ALL);

                    navigator.smartstore.runSmartQuery(querySpec, function (cursor) {
                        var entries = cursor.currentPageOrderedEntries;

                        if (entries && entries.length > 0) {

                            var promises = [];

                            var currentLinkedEntityKeyPrefix = null;
                            var currentBatchContentDocumentId = [];

                            for (var i = 0; i < entries.length; i++) {
                                var contentDocumentId = entries[i][0];
                                var linkedEntityId = entries[i][1];
                                var keyPrefix = linkedEntityId.substr(0, 3);

                                if (!currentLinkedEntityKeyPrefix && currentLinkedEntityKeyPrefix === keyPrefix) {
                                    currentBatchContentDocumentId.push(contentDocumentId);
                                } else {
                                    currentBatchContentDocumentId.push(contentDocumentId);
                                    promises.push(resetSyncFileOnDemandByCommonLinkedType(contentVersionRecords, currentBatchContentDocumentId, keyPrefix));
                                    currentBatchContentDocumentId = [];
                                }

                                currentLinkedEntityKeyPrefix = keyPrefix;
                            }

                            $q.all(promises).then(function (allUpdatedContentVersionRecords) {

                                var updatedRecords = [];
                                for (var i = 0; i < allUpdatedContentVersionRecords.length; i++) {
                                    updatedRecords = updatedRecords.concat(allUpdatedContentVersionRecords[i]);
                                }
                                navigator.smartstore.upsertSoupEntries('ContentVersion', updatedRecords, function () {
                                    deferred.resolve(true);
                                });
                            }, function (err) {
                                deferred.reject(err);
                            });
                        } else {
                            deferred.resolve(true);
                        }
                    });

                    return deferred.promise;
                };

                /**
                 * Reset the field '_versionDataSyncOnDemand' value of contentVersion records according to a common linked type keyPrefix and
                 * contentDocument id array which have the same linked object type.
                 *
                 * @param   {Array} contentVersionRecords - contentVersion records array
                 * @param   {Array} contentDocumentIds
                 * @param   {string} commonLinkedTypeKeyPrefix
                 * @returns {Promise}
                 */
                var resetSyncFileOnDemandByCommonLinkedType = function (contentVersionRecords, contentDocumentIds, commonLinkedTypeKeyPrefix) {

                    var deferred = $q.defer();

                    contentDocumentIds = angular.copy(contentDocumentIds);

                    DescribeService.getObjectNameByKeyPrefix(commonLinkedTypeKeyPrefix).then(function (linkedObjectName) {

                        // get target object configuration
                        LocalDataService.queryConfiguredObjectByName(linkedObjectName).then(function (linkedObjectType) {
                            var defaultVersionDataSyncOnDemand = (linkedObjectType['MobileVizArt__File_On_Demand__c'] === undefined
                            || linkedObjectType['MobileVizArt__File_On_Demand__c'] === null) ? true : linkedObjectType['MobileVizArt__File_On_Demand__c'];

                            var updatedContentVersionRecords = [];

                            for (var i = 0; i < contentVersionRecords.length; i++) {
                                var item = contentVersionRecords[i];
                                if (contentDocumentIds.indexOf(item['ContentDocumentId']) !== -1) {
                                    item['_versionDataSyncOnDemand'] = defaultVersionDataSyncOnDemand;
                                    updatedContentVersionRecords.push(item);
                                }
                            }

                            deferred.resolve(updatedContentVersionRecords);
                        }, function (error) {
                            deferred.reject(error);
                        });
                    }, function (error) {
                        deferred.reject(error);
                    });

                    return deferred.promise;
                };

                /**
                 * Sync down file data which is the versionData of the ContentVersion into file system one by one.
                 * After sync finished, update flag field '_versionDataSynced' to true.
                 *
                 * @param   {Array} contentVersionEntries - contentVersion records array
                 * @param   {object} [syncBodyProcess] - optional, the first page doesn't need this parameter, sync down file data process status
                 * @param   {string} [lastContentDocumentId] - optional, the first page doesn't need this parameter, contentDocument id of the last deal file
                 * @param   {number} [index] - optional, the first page doesn't need this parameter, default is 0, current deal file index
                 * @param   {object} [deferred] - the first page doesn't need this parameter, but following pages need this when the method is invoked recursively
                 * @returns {Promise}
                 */
                var syncDownFileData = function (contentVersionEntries, syncBodyProcess, lastContentDocumentId, index, deferred) {

                    deferred = deferred || $q.defer();
                    index = (index === undefined) ? 0 : index;

                    if (!syncBodyProcess) {
                        syncBodyProcess = {
                            total: contentVersionEntries.length,
                            processed: 0,
                            failed: 0
                        }
                    }

                    // get current deal contentVersion
                    var contentVersion = contentVersionEntries[index];

                    // Common error operation collection including notifying process, updating field '_versionDataSynced' and '_versionDataSyncError',
                    // and processing next one deal or returning result.
                    var commonErrorOperation = function (err) {
                        contentVersion['_versionDataSynced'] = false;
                        contentVersion['_versionDataSyncError'] = err;

                        syncBodyProcess['failed'] += 1;
                        deferred.notify(syncBodyProcess);

                        syncDownFileData(contentVersionEntries, syncBodyProcess, lastContentDocumentId, index, deferred);
                    };

                    var saveFile = function (contentDocumentSid, contentData) {

                        // save the latest version file data into file system
                        FileService.saveFileData({_soupEntryId: contentDocumentSid}, contentData).then(function () {
                            contentVersion['_versionDataSynced'] = true;

                            syncBodyProcess['processed'] += 1;
                            deferred.notify(syncBodyProcess);

                            syncDownFileData(contentVersionEntries, syncBodyProcess, lastContentDocumentId, index, deferred);
                        }, function (error) {
                            commonErrorOperation(error + '');
                        });
                    };

                    if (!contentVersion) {

                        // update contentVersion records by new status '_versionDataSynced'=true after sync down finished
                        _localSyncUpsertSoupEntriesWithExternalId('ContentVersion', contentVersionEntries).then(function () {
                            deferred.resolve(syncBodyProcess);
                        }, function (error) {
                            deferred.reject(error);
                        });
                    } else {

                        // next record index
                        index++;

                        if (lastContentDocumentId && lastContentDocumentId === contentVersion['ContentDocumentId']) {
                            lastContentDocumentId = contentVersion['ContentDocumentId'];

                            commonErrorOperation('Have already synced the latest version file in file system, the versionData of this record not need to sync down.');
                        } else {
                            lastContentDocumentId = contentVersion['ContentDocumentId'];

                            var forceClient = ForceClientService.getForceClient();

                            var requestUrl = '/v36.0/sobjects/ContentVersion/' + contentVersion.Id + '/versionData';

                            // get versionData arrayBuffer data of contentVersion from salesforce
                            forceClient.getChatterFile(requestUrl, null,
                                function (contentData) {

                                    if (contentVersion.ContentDocumentId_sid) {
                                        saveFile(contentVersion.ContentDocumentId_sid, contentData);
                                    } else {
                                        LocalDataService.getRecordsSidBySFid('ContentDocument', [contentVersion.ContentDocumentId]).then(function (contentDocumentSids) {
                                            if (contentDocumentSids && contentDocumentSids[0]) {
                                                saveFile(contentDocumentSids[0], contentData);
                                            } else {
                                                commonErrorOperation('syncDownFileData not found contentDocument record of ContentDocumentId:' + contentVersion.ContentDocumentId);
                                            }
                                        }, function (error) {
                                            deferred.reject(error);
                                        });
                                    }
                                }, function (error) {
                                    $log.warn(new Exception(null, error.status, error.message, error.stack, error));
                                    commonErrorOperation(error + '');
                                }
                            );
                        }
                    }

                    return deferred.promise;
                };

                /**
                 * Start sync down the body of the Attachment whose '_bodySynced' and '_bodySyncOnDemand' fields are false (mneans unsynced but need to sync).
                 * The body maybe store in AttachmentBody soup or in the file system according to the settings.
                 * After sync finished, update '_bodySynced' flag field to true.
                 *
                 * Alternatively, if there are attachment ids are passed in the fucntion, then it would sync down the body of them no matter what the values of
                 *  _bodySynced and _bodySyncOnDemand fields are.
                 *
                 * @param   {Array} [attachmentSids] - specific attachments' ids for syncing down the bodys
                 * @returns {Promise}
                 */
                service.startSyncDownAttachmentBody = function (attachmentSids) {

                    var deferred = $q.defer();

                    // whether exist soup 'Attachment'
                    $injector.get('SmartStoreService').checkSoupExist('Attachment').then(function (exist) {
                        if (exist) {

                            var smartSql;

                            if (attachmentSids && attachmentSids.length > 0) {

                                // Query specific attachments no matter what the values of the _body fields are
                                smartSql = 'Select {Attachment:_soup} From {Attachment} Where {Attachment:_soupEntryId} in (' + attachmentSids.join(',') + ')';
                            } else {

                                var utilService = $injector.get('UtilService');
                                var isAndroid = utilService.isAndroidOS();

                                var booleanFalse = 0;
                                var booleanTrue = 1;

                                if (isAndroid) {
                                    booleanFalse = '\'false\'';
                                    booleanTrue = '\'true\'';
                                }

                                // query all Attachment data whose '_bodySynced' and '_bodySyncOnDemand' fields are not true.
                                smartSql = 'Select {Attachment:_soup} From {Attachment} Where ({Attachment:_bodySynced} is null or {Attachment:_bodySynced} = ' + booleanFalse + ') and {Attachment:Id} is not null';
                                smartSql += ' and {Attachment:_bodySyncOnDemand} = ' + booleanFalse;
                            }
                            void 0;

                            var querySpec = navigator.smartstore.buildSmartQuerySpec(smartSql, SMARTSTORE_COMMON_SETTING.PAGE_SIZE_FOR_ALL);
                            navigator.smartstore.runSmartQuery(querySpec, function (cursor) {
                                var entries = cursor.currentPageOrderedEntries;

                                if (entries && entries.length > 0) {

                                    var attachmentEntries = _.pluck(entries, 0);

                                    // sync down attachment body
                                    syncDownAttachmentBody(attachmentEntries).then(function (success) {
                                        deferred.resolve(success);
                                    }, function (error) {
                                        deferred.reject(error);
                                    }, function (process) {
                                        deferred.notify(process);
                                    });
                                } else {
                                    deferred.resolve({
                                        total: 0,
                                        processed: 0,
                                        failed: 0
                                    });
                                }
                            });
                        } else {
                            deferred.resolve({});
                        }
                    }, function (error) {
                        deferred.reject(error);
                    });

                    return deferred.promise;
                };


                /**
                 * Start clean up the body of the Attachment whose attachment records have already bean deleted,
                 * include the body data in the soup and in the file system.
                 *
                 * @returns {Promise}
                 */
                service.startCleanUpAttachmentBody = function () {

                    var deferred = $q.defer();

                    // whether exist soup 'Attachment'
                    $injector.get('SmartStoreService').checkSoupExist('Attachment').then(function (exist) {
                        if (exist) {

                            // query all Attachment soup entry id
                            LocalDataService.getAllRecordsSidBySoup('Attachment').then(function (sidArray) {

                                // get all attachment folder name(_soupEntryId) array in file system
                                FileService.getAllAttachmentFolderNames().then(function (folderNames) {

                                    var dirtyFileNames = [];
                                    for (var i = 0; i < folderNames.length; i++) {
                                        if (sidArray.indexOf(parseInt(folderNames[i])) === -1) {
                                            dirtyFileNames.push(folderNames[i]);
                                        }
                                    }

                                    // remove dirty attachment file
                                    FileService.removeAttachmentBySids(dirtyFileNames).then(function () {

                                        // query all AttachmentBody records
                                        var smartSql = 'Select {AttachmentBody:_soupEntryId}, {AttachmentBody:AttachmentSid} From {AttachmentBody}';
                                        var querySpec = navigator.smartstore.buildSmartQuerySpec(smartSql, SMARTSTORE_COMMON_SETTING.PAGE_SIZE_FOR_ALL);

                                        navigator.smartstore.runSmartQuery(querySpec, function (cursor) {
                                            var entries = cursor.currentPageOrderedEntries;

                                            if (entries && entries.length > 0) {

                                                // find the related AttachmentBody soup id of the dirty attachment records
                                                var dirtyAttachmentBodySid = [];
                                                for (var j = 0; j < entries.length; j++) {
                                                    var item = entries[j];
                                                    if (sidArray.indexOf(parseInt(item[1])) === -1) {
                                                        dirtyAttachmentBodySid.push(item[0]);
                                                    }
                                                }

                                                if (dirtyAttachmentBodySid.length > 0) {
                                                    navigator.smartstore.removeFromSoup('AttachmentBody', dirtyAttachmentBodySid, function () {
                                                        deferred.resolve(true);
                                                    }, function (error) {
                                                        deferred.reject(error);
                                                    });
                                                } else {
                                                    deferred.resolve(true);
                                                }
                                            } else {
                                                deferred.resolve(true);
                                            }
                                        });
                                    }, function (error) {
                                        deferred.reject(error);
                                    });
                                }, function (error) {
                                    deferred.reject(error);
                                });
                            }, function (error) {
                                deferred.reject(error);
                            });
                        } else {
                            deferred.resolve(true);
                        }
                    }, function (error) {
                        deferred.reject(error);
                    });

                    return deferred.promise;
                };


                /**
                 * Sync down the body of the Attachment into soup or file system according to setting one by one.
                 * After sync finished, update flag field '_bodySynced' to true.
                 *
                 * @param   {Array} attachmentEntries - attachment records array
                 * @param   {object} [syncBodyProcess] - optional, the first page doesn't need this parameter, sync down attachment body process status
                 * @param   {number} [index] - optional, the first page doesn't need this parameter, default is 0, current deal attachment index
                 * @param   {object} [deferred] - the first page doesn't need this parameter, but following pages need this when the method is invoked recursively
                 * @returns {Promise}
                 */
                var syncDownAttachmentBody = function (attachmentEntries, syncBodyProcess, index, deferred) {

                    deferred = deferred || $q.defer();
                    index = (index === undefined) ? 0 : index;

                    if (!syncBodyProcess) {
                        syncBodyProcess = {
                            total: attachmentEntries.length,
                            processed: 0,
                            failed: 0
                        }
                    }

                    // get current deal attachment
                    var attachment = attachmentEntries[index];

                    // Common error operation collection including notifying process, updating field '_bodySynced' and '_bodySyncError',
                    // and processing next one deal or returning result.
                    var commonErrorOperation = function (err) {
                        attachment['_bodySynced'] = false;
                        attachment['_bodySyncError'] = err;

                        syncBodyProcess['failed'] += 1;
                        deferred.notify(syncBodyProcess);

                        syncDownAttachmentBody(attachmentEntries, syncBodyProcess, index, deferred);
                    };

                    if (!attachment) {

                        // update attachment records by new status '_bodySynced'=true after sync down finished
                        _localSyncUpsertSoupEntriesWithExternalId('Attachment', attachmentEntries).then(function () {
                            deferred.resolve(syncBodyProcess);
                        }, function (error) {
                            deferred.reject(error);
                        });
                    } else {

                        // next record index
                        index++;

                        if (attachment['ParentId_type']) {

                            // get attachment related object type configuration information
                            LocalDataService.queryConfiguredObjectByName(attachment['ParentId_type']).then(function (relatedObjectType) {

                                var forceClient = ForceClientService.getForceClient();

                                var requestUrl = '/v36.0/sobjects/Attachment/' + attachment.Id + '/body';

                                // get arrayBuffer body data of attachment from salesforce
                                forceClient.getChatterFile(requestUrl, attachment['ContentType'],
                                    function (contentData) {

                                        // save attachment body into soup AttachmentBody or file system
                                        FileService.saveAttachmentBody(attachment, relatedObjectType, contentData).then(function () {
                                            attachment['_bodySynced'] = true;

                                            syncBodyProcess['processed'] += 1;
                                            deferred.notify(syncBodyProcess);

                                            syncDownAttachmentBody(attachmentEntries, syncBodyProcess, index, deferred);
                                        }, function (error) {
                                            commonErrorOperation(error + '');
                                        });
                                    }, function (error) {
                                        $log.warn(new Exception(null, error.status, error.message, error.stack, error));
                                        commonErrorOperation(error + '');
                                    }
                                );
                            }, function (error) {
                                commonErrorOperation(error + '');
                            });
                        } else {
                            commonErrorOperation('Not setting ParentId_type.');
                        }
                    }

                    return deferred.promise;
                };

                /**
                 * Start cleaning up for all configured objects, it needs to sync down any records newly assigned via sharing
                 * and remove all local records which are not existing in SFDC any more.
                 *
                 * @param {object} objectSyncWrapper
                 */
                service.startCleanUpObjects = function (objectSyncWrapper) {
                    var deferred = $q.defer();

                    if (!objectSyncWrapper.cleanUpObjects || objectSyncWrapper.cleanUpObjects.objectTypes.length === 0) {
                        deferred.resolve(objectSyncWrapper);
                        return deferred.promise;
                    }

                    // JSI: removed. Reason, if a IonicLoadingService window is already opened, the cleanup will close
                    // this windows. the after the cleanup processes reference recreated will not be cover than by a
                    // synchronizing message
                    //var IonicLoadingService = $injector.get('IonicLoadingService');

                    var syncSequential = function (index) {
                        if (index >= objectSyncWrapper.cleanUpObjects.objectTypes.length) {

                            var contentDocumentObjectType = _.findWhere(objectSyncWrapper.cleanUpObjects.objectTypes, {name: 'ContentDocument'});
                            var contentVersionObjectType = _.findWhere(objectSyncWrapper.cleanUpObjects.objectTypes, {name: 'ContentVersion'});
                            if (contentDocumentObjectType && contentVersionObjectType) {

                                // clean up ContentDocument and ContentVersion according to the cleaned ContentDocumentLink records
                                service.cleanUpAllContentDocument().then(function (cleanUpResults) {

                                    for (var i = 0; i < cleanUpResults.length; i++) {
                                        var subProcessStatus = cleanUpResults[i];
                                        var subProgressObj = objectSyncWrapper.cleanUpObjects.syncProgress[subProcessStatus['objectName']];
                                        subProgressObj.status.newVisiableRecords += subProcessStatus['newVisiableRecords'];
                                        subProgressObj.status.dirtyRecords += subProcessStatus['dirtyRecords'];

                                        deferred.notify(objectSyncWrapper);
                                    }

                                    MetaService.setMetaValue('lastCleanUpDate', new Date());
                                    //IonicLoadingService.hide();

                                    // No more objects need to be processed.
                                    deferred.resolve(objectSyncWrapper);
                                }, function (error) {
                                    //IonicLoadingService.hide();
                                    deferred.reject(error);
                                });
                            } else {

                                MetaService.setMetaValue('lastCleanUpDate', new Date());
                                //IonicLoadingService.hide();

                                // No more objects need to be processed.
                                deferred.resolve(objectSyncWrapper);
                            }
                        } else {

                            // Current object type
                            var objType = objectSyncWrapper.cleanUpObjects.objectTypes[index];
                            void 0;

                            if (objType.needCleanUp) {

                                service.cleanUpObjectRecords(objType).then(function (result) {

                                    if (objType !== undefined && skipCleanUpObjects.indexOf(objType.name) === -1) {

                                        // update progress status to wrapper from the result
                                        var progressObj = objectSyncWrapper.cleanUpObjects.syncProgress[objType.name];
                                        progressObj.status.newVisiableRecords += result.newVisiableRecords;
                                        progressObj.status.dirtyRecords += result.dirtyRecords;

                                        deferred.notify(objectSyncWrapper);
                                    }

                                    // Update subsidiary records amount to first level ANTEs (Task, Event, Note and Attachment) and File link (ContentDocumentLink)
                                    if (result['subsidiaryRecords'] && result['subsidiaryRecords'].length > 0) {
                                        for (var i = 0; i < result['subsidiaryRecords'].length; i++) {
                                            var subProcessStatus = result['subsidiaryRecords'][i];
                                            var subProgressObj = objectSyncWrapper.cleanUpObjects.syncProgress[subProcessStatus['objectName']];
                                            subProgressObj.status.newVisiableRecords += subProcessStatus['newVisiableRecords'];
                                            subProgressObj.status.dirtyRecords += subProcessStatus['dirtyRecords'];

                                            deferred.notify(objectSyncWrapper);
                                        }
                                    }

                                    syncSequential(index + 1);
                                }, function (error) {
                                    //IonicLoadingService.hide();
                                    deferred.reject(error);
                                }, function (process) {

                                    //console.log('>>>> _syncDownDeltaSharedRecordsForObjects processing status: ' + JSON.stringify(process));
                                    // update progress status to wrapper from the process
                                    var progressObj = objectSyncWrapper.cleanUpObjects.syncProgress[objType.name];
                                    progressObj.status.newVisiableRecords += process.newVisiableRecords;
                                    progressObj.status.dirtyRecords += process.dirtyRecords;

                                    deferred.notify(objectSyncWrapper);
                                });
                            } else {
                                syncSequential(index + 1);
                            }
                        }
                    };

                    // check whether force cleanUp process is necessary no matter whether the interval is overdue or not
                    if (!objectSyncWrapper.cleanUpObjects.forceCleanup) {

                        // check whether the cleanUp interval is overdue
                        checkCleanUpInterval().then(function (cleanupTimeUp) {
                            if (cleanupTimeUp) {

                                //IonicLoadingService.show('<ion-spinner icon="ripple" style="stroke: #ffffff; fill: #ffffff"></ion-spinner>' +
                                //    '<br/><span>' + $injector.get('$filter')('translate')('cl.sync.lb_cleanUp_process') + '</span>', false);

                                // Start to clean up the first object
                                syncSequential(0);

                            } else {
                                deferred.resolve(objectSyncWrapper);
                            }
                        }, function (error) {
                            deferred.reject(error);
                        });
                    } else {

                        //IonicLoadingService.show('<ion-spinner icon="ripple" style="stroke: #ffffff; fill: #ffffff"></ion-spinner>' +
                        //    '<br/><span>' + $injector.get('$filter')('translate')('cl.sync.lb_cleanUp_process') + '</span>', false);

                        // Start to clean up the first object
                        syncSequential(0);
                    }

                    return deferred.promise;
                };

                /**
                 * @ngdoc method
                 * @name checkCleanUpInterval
                 * @methodOf oinio.core.service:LocalSyncService
                 * @description
                 * Check whether last cleanup process is exceed the setting interval time at the moment.
                 *
                 * @returns {promise}
                 */
                var checkCleanUpInterval = function () {
                    var deferred = $q.defer();
                    var intervalDate = 0; // hours

                    LocalDataService.queryConfigurationAndObjects().then(function (configuraion) {
                        var cleanupInterval = configuraion['MobileVizArt__Cleanup_Interval__c'];
                        if (cleanupInterval && parseFloat(cleanupInterval)) {
                            intervalDate = parseFloat(cleanupInterval);
                        }

                        return MetaService.getMetaValue('lastCleanUpDate');
                    }).then(function (lastCleanUpDate) {
                        var nowTime = new Date();

                        if (!lastCleanUpDate || (lastCleanUpDate &&
                            (nowTime.getTime() - (new Date(lastCleanUpDate)).getTime()) > intervalDate * 60 * 60 * 1000)) {

                            // get the confirm of going on cleanup process from user
                            var $ionicPopup = $injector.get('$ionicPopup');
                            var $filter = $injector.get('$filter');

                            var confirmPopup = $ionicPopup.confirm({
                                title: $filter('translate')('cl.sync.lb_cleanUp'),
                                subTitle: $filter('translate')('cl.sync.lb_cleanUp_confirm'),
                                okText: $filter('translate')('cl.sync.btn_cleanUp'),
                                cancelText: $filter('translate')('cl.global.btn_cancel')
                            });
                            confirmPopup.then(function (res) {
                                if (res) {
                                    deferred.resolve(true);
                                } else {
                                    deferred.resolve(false);
                                }
                            });
                        } else {
                            deferred.resolve(false);
                        }
                    }).catch(function (error) {
                        deferred.reject(error);
                    });

                    return deferred.promise;
                };

                /**
                 * Sync down any records newly assigned via sharing.
                 *
                 * @param {object} objectSyncWrapper
                 */
                var _syncDownDeltaSharedRecordsForObjects = function (objectSyncWrapper) {
                    var deferred = $q.defer();

                    // TODO1: Call rest service to get delta shared records for each object
                    var syncSequential = function (index) {
                        if (index >= objectSyncWrapper.cleanUpObjects.objectTypes.length) {

                            // No more objects need to be processed.
                            deferred.resolve(objectSyncWrapper);
                        } else {

                            // Current object type
                            var objType = objectSyncWrapper.cleanUpObjects.objectTypes[index];
                            void 0;

                            // TODO: check objType.needCleanUp

                            _syncDownDeltaSharedRecords(objType).then(function (result) {

                                // TODO1: update progress status to wrapper from the result
                                deferred.notify(objectSyncWrapper);

                                syncSequential(index + 1);
                            }, function (error) {
                                deferred.reject(error);
                            }, function (process) {

                                //console.log('>>>> _syncDownDeltaSharedRecordsForObjects processing status: ' + JSON.stringify(process));
                                // TODO1: update progress status to wrapper from the process
                                deferred.notify(objectSyncWrapper);
                            });
                        }
                    };

                    // Start to sync the first object
                    syncSequential(0);

                    return deferred.promise;
                };

                /**
                 * Sync down any records newly assigned via sharing for a specific object.
                 *
                 * @param {object} objType
                 * @returns {*}
                 */
                var _syncDownDeltaSharedRecords = function (objType) {

                    var deferred = $q.defer();

                    // Get last clean up date for new share from local database
                    MetaService.getObjectMetaByType(objType.name).then(function (objMeta) {

                        // Set last clean up date for new share from local database as parameters
                        if (objMeta && objMeta.lastCleanUpDateForNewShare) {
                            objType.lastCleanUpDateForNewShare = objMeta.lastCleanUpDateForNewShare;
                        }
                        void 0;

                        var payload = {
                            lastSyncTimeStamp: objType.lastCleanUpDateForNewShare,
                            serverTimeStamp: objType._serverTimestamp,
                            soql: generateSoqlForObject(objType),
                            sobjectType: objType.name,
                            pageSize: SYNC_PAGE_SIZE.CLEAN_UP_DOWNLOAD_DELTA_SHARED_RECORDS,
                            lastId: null
                        };

                        // Sync all new shared records after last sync date
                        _syncDownNewSharedRecordsFromSFDC(payload).then(function (done) {

                            // Update last sync down date to local database
                            MetaService.updateLastCleanUpDateForNewShare(objType.name, objType._serverTimestamp || new Date().toISOString()).then(function () {
                                deferred.resolve(done);
                            }, function (error) {
                                deferred.reject(error);
                            });
                        }, function (error) {
                            deferred.reject(error);
                        }, function (progress) {
                            deferred.notify(progress);
                        });
                    }, function (error) {
                        deferred.reject(error);
                    });

                    return deferred.promise;
                };

                /**
                 * get child relationships for object: only return configured child objects
                 *
                 * @param {string} objectName
                 * @returns {promise} resolve relationshp array, e.g. Account child object Contact [{name: "Contact", field: "AccountId", sql: "xxxxx"}]
                 */
                var _getObjectConfiguredChildRelationships = function (objectName) {
                    return $q(function (resolve, reject) {
                        if (!objectName) {
                            reject('_getObjectChildRelationships error: Missing parameter');
                        } else {
                            // load all configure object informations
                            ConfigurationService.objectTypesToSynchronize().then(function (objectTypes) {
                                var objectTypesMap = {};
                                angular.forEach(objectTypes, function (o) {
                                    objectTypesMap[o.name] = o;
                                });

                                // load the object's childrelationships
                                DescribeService.getDescribeSObject(objectName).then(function (describeResult) {
                                    var relationships = [];
                                    if (describeResult && describeResult.childRelationships && describeResult.childRelationships.length > 0) {
                                        angular.forEach(describeResult.childRelationships, function (r) {
                                            var rname = r.childSObject;
                                            if (objectTypesMap[rname] && r.cascadeDelete === true) {
                                                relationships.push({
                                                    name: rname,
                                                    field: r.field,
                                                    sql: generateSoqlForObject(objectTypesMap[rname])
                                                });
                                            }
                                        });
                                    }

                                    resolve(relationships);
                                }, function (err) {
                                    void 0;
                                    reject(err);
                                });
                            }, function (err) {
                                void 0;
                                reject(err);
                            });
                        }
                    });
                };

                /**
                 * download all child records for object: include child and its posterities
                 *
                 * @param {string} objectName
                 * @param {array} recordIds
                 * @returns {promise} resolve true if the process has done
                 */
                var _localSyncDownloadObjectAllChildRecords = function (objectName, recordIds) {
                    var deferred = $q.defer();

                    var pageSize = SYNC_PAGE_SIZE.CLEAN_UP_DOWNLOAD_CHILD_RECORDS;

                    if (!objectName) {
                        deferred.reject('_localSyncDownloadObjectAllChildRecords error: Missing parameter --> objectName');
                    } else {
                        if (recordIds && recordIds.length > 0) {
                            // get object childRelationships
                            _getObjectConfiguredChildRelationships(objectName).then(function (relationships) {
                                void 0;
                                if (relationships && relationships.length) {
                                    var _syncDownChildObjectRecords = function (start, rindex, currentDoingChildRecordIds) {
                                        start = start || 0;
                                        currentDoingChildRecordIds = currentDoingChildRecordIds || [];
                                        var relationship = relationships[rindex];
                                        void 0;

                                        if (start >= recordIds.length) {
                                            // current child done, load child's child
                                            void 0;
                                            _localSyncDownloadObjectAllChildRecords(relationship.name, currentDoingChildRecordIds).then(function (done) {
                                                if (rindex + 1 >= relationships.length) {
                                                    // no more child
                                                    deferred.resolve(true);
                                                } else {
                                                    // do next child
                                                    _syncDownChildObjectRecords(0, rindex + 1, []);
                                                }
                                            }, function (err) {
                                                void 0;
                                                deferred.reject(err);
                                            });
                                        } else {
                                            var sql = relationship.sql;
                                            var batchRecords = recordIds.slice(start, start + pageSize);
                                            sql += ' AND ' + relationship.field + ' IN (\'' + batchRecords.join('\',\'') + '\')';
                                            SalesforceDataService.queryAll(sql).then(function (records) {
                                                void 0;
                                                angular.forEach(records, function (r) {
                                                    if (currentDoingChildRecordIds.indexOf(r.Id) === -1) {
                                                        currentDoingChildRecordIds.push(r.Id);
                                                    }
                                                });
                                                _localSyncUpsertSoupEntriesWithExternalId(relationship.name, records).then(function (done) {
                                                    start += pageSize;
                                                    _syncDownChildObjectRecords(start, rindex, currentDoingChildRecordIds);
                                                }, function (err) {
                                                    void 0;
                                                    deferred.reject(err);
                                                });
                                            }, function (err) {
                                                void 0;
                                                deferred.reject(err);
                                            });
                                        }
                                    };

                                    _syncDownChildObjectRecords(0, 0, []);
                                } else {
                                    deferred.resolve(true);
                                }
                            }, function (err) {
                                void 0;
                                deferred.reject(err);
                            });
                        } else {
                            deferred.resolve(true);
                        }
                    }

                    return deferred.promise;
                };

                /**
                 * sync down new shared records from salesforce
                 *
                 * @param {object} payload
                 * @param {object} [deferred] - the first page doesn't need this parameter, but following pages need this when the method is invoked recursively
                 * @returns {*|b.promise|Function}
                 */
                var _syncDownNewSharedRecordsFromSFDC = function (payload, deferred) {

                    if (!deferred) {
                        deferred = $q.defer();
                    }

                    if (!payload.lastSyncTimeStamp) {

                        // There is no need to sync any shared records for the first time (no lastSyncTimeStamp), because all records have already been downloaded in normal sync down process.
                        // TODO1: update process status
                        deferred.resolve();
                        return deferred.promise;
                    }

                    // Sync down records for current object type
                    // TODO1: think about there is still possibility that the delta shared data have already been synced down in the normal sync down process
                    RestService.syncDownSharedRecords(payload).then(function (response) {

                        void 0;

                        // upsert records
                        _localSyncUpsertSoupEntriesWithExternalId(payload.sobjectType, response.records).then(function () {

                            // TODO1: before querying the next page, we need to sync down all the detailed records and sub detailed records, and sub-sub as they don't have sharing table at all
                            var recordIds = [];
                            angular.forEach(response.records, function (r) {
                                if (recordIds.indexOf(r.Id) === -1) {
                                    recordIds.push(r.Id);
                                }
                            });
                            _localSyncDownloadObjectAllChildRecords(payload.sobjectType, recordIds).then(function (done) {
                                if (!response.lastId) {

                                    // No more shared records
                                    deferred.resolve(response);
                                } else {

                                    // Set payload last id for querying the next page
                                    payload.lastId = response.lastId;

                                    // TODO1: Update process status
                                    deferred.notify(response);
                                    void 0;

                                    _syncDownNewSharedRecordsFromSFDC(payload, deferred);
                                }
                            }, function (err) {
                                void 0;
                                deferred.reject(err);
                            });

                        }, function (err) {
                            deferred.reject(err);
                        });

                    }, function (error) {
                        deferred.reject(error);
                    });

                    return deferred.promise;
                };


                /**
                 * generate soql string for sync down records from Salesforce
                 *
                 * @param {object} objectType
                 * @param {string} [queryFields] query fields from salesforce, using the separator ","
                 * @returns {string}
                 */
                var generateSoqlForObject = function (objectType, queryFields) {
                    var tableName = objectType.name;
                    var fields = objectType.fields;
                    var filterCriteria = objectType.filterCriteria;

                    var queryStr = 'SELECT ';
                    if (queryFields) {
                        queryStr += queryFields;
                    } else {
                        queryStr += fields.toString();
                    }
                    queryStr += ' FROM ' + tableName + ' WHERE Id != null';

                    if (filterCriteria) {
                        queryStr += ' AND ' + filterCriteria;
                    }

                    return queryStr;
                };

                /**
                 * generate soql string for check total of records from Salesforce while in cleanup process
                 *
                 * @param {object} objectType
                 * @returns {string}
                 */
                var generateSoqlForCheckTotal = function (objectType) {
                    var tableName = objectType.name;
                    var fields = objectType.fields;
                    var filterCriteria = objectType.filterCriteria;

                    var queryStr = 'SELECT count(Id) total FROM ' + tableName + ' WHERE Id != null';

                    if (filterCriteria) {
                        queryStr += ' AND ' + filterCriteria;
                    }

                    return queryStr;
                };


                /**
                 * Check and remove local dirty records which are not existing in SFDC any more.
                 *
                 * @param {object} objectSyncWrapper
                 */
                var _checkAndRemoveLocalDirtyRecordsForObjects = function (objectSyncWrapper) {

                    var deferred = $q.defer();

                    _checkTotalRecordsForObjects(objectSyncWrapper.cleanUpObjects.objectTypes).then(function (map_objectType_total) {

                        deferred.resolve(objectSyncWrapper);

                        var syncSequential = function (index) {
                            if (index >= objectSyncWrapper.cleanUpObjects.objectTypes.length) {

                                // No more objects need to be processed.
                                deferred.resolve(objectSyncWrapper);
                            } else {

                                // Current object type
                                var objType = objectSyncWrapper.cleanUpObjects.objectTypes[index];

                                void 0;

                                // TODO: check objType.needCleanUp

                                _checkAndRemoveLocalDirtyRecords(objType, map_objectType_total[objType.name]).then(function (result) {

                                    // TODO1: update progress status to wrapper from the result
                                    deferred.notify(objectSyncWrapper);

                                    syncSequential(index + 1);
                                }, function (error) {
                                    deferred.reject(error);
                                }, function (process) {

                                    // TODO1: update progress status to wrapper from the process
                                    deferred.notify(objectSyncWrapper);
                                });
                            }
                        };

                        // Start to sync the first object
                        syncSequential(0);
                    }, function (error) {
                        deferred.reject(error);
                    });

                    return deferred.promise;
                };


                /**
                 * Check total records in SFDC for objects.
                 *
                 * @param {object} objectTypes
                 */
                var _checkTotalRecordsForObjects = function (objectTypes) {
                    var deferred = $q.defer();

                    if (objectTypes && objectTypes.length > 0) {
                        var payload = {
                            serverTimeStamp: objectTypes[0]._serverTimestamp,
                            map_objectType_soql: {}
                        };

                        for (var i = 0; i < objectTypes.length; i++) {
                            var objType = objectTypes[i];
                            payload.map_objectType_soql[objType.name] = generateSoqlForCheckTotal(objType);
                        }

                        // check records total sum of salesforce
                        RestService.checkTotalRecords(payload).then(function (response) {
                            deferred.resolve(response.map_objectType_total);
                        }, function (err) {
                            deferred.reject(err);
                        });
                    } else {
                        deferred.resolve({});
                    }

                    return deferred.promise;
                };

                /**
                 * Check and remove local dirty records which are not existing in SFDC any more for a specific object.
                 *
                 * @param {object} objType
                 * @param {number} sfSum
                 */
                var _checkAndRemoveLocalDirtyRecords = function (objType, sfSum) {

                    var deferred = $q.defer();
                    var pageSize = SYNC_PAGE_SIZE.CLEAN_UP_CHECK_RECORDS_EXISTENCE;

                    // remove inactive records which have not salesforce Id
                    _removeInactiveLocalRecords(objType.name).then(function () {

                        LocalDataService.getRecordsSumBySoup(objType.name, '{' + objType.name + ':Id} is not null').then(function (localSum) {
                            if (sfSum == localSum || localSum == 0) {
                                deferred.resolve();
                            } else {
                                LocalDataService.getAllRecordsSFIdBySoup(objType.name).then(function (localSfIds) {

                                    var syncSequential = function () {
                                        var batchData = localSfIds.splice(0, pageSize);

                                        if (sfSum === localSum || batchData.length === 0) {

                                            // No more records need to be processed.
                                            deferred.resolve();
                                        } else {

                                            var payload = {
                                                recordIds: batchData,
                                                objectType: objType.name
                                            };

                                            // check records whether exist in salesforce
                                            RestService.checkRecordsExistence(payload).then(function (response) {

                                                if (response.recordIds && response.recordIds.length) {

                                                    // delete these local records which are not exist or can't be accessed in salesforce, and not active in queue
                                                    _removeInactiveRecordsBySFIds(objType.name, response.recordIds).then(function () {
                                                        localSum -= response.recordIds.length;
                                                        syncSequential();
                                                    }, function (error) {
                                                        deferred.reject(error);
                                                    });
                                                } else {
                                                    syncSequential();
                                                }
                                            }, function (err) {
                                                deferred.reject(err);
                                            });
                                        }
                                    };

                                    syncSequential();
                                }, function (error) {
                                    deferred.reject(error);
                                });
                            }
                        }, function (error) {
                            deferred.reject(error);
                        });
                    }, function (error) {
                        deferred.reject(error);
                    });

                    return deferred.promise;
                };

                /**
                 * clean up records of a specific sobject from Salesforce
                 *
                 * @param {object} objType
                 * @returns {*}
                 */
                service.cleanUpObjectRecords = function (objType) {

                    var deferred = $q.defer();

                    if (objType !== undefined && skipCleanUpObjects.indexOf(objType.name) === -1) {

                        // Get last clean up date from local database
                        MetaService.getObjectMetaByType(objType.name).then(function (objMeta) {

                            // Set last clean up date from local database as parameters
                            if (objMeta && objMeta.lastCleanUpDate) {
                                objType.lastCleanUpDate = objMeta.lastCleanUpDate;
                            }
                            void 0;

                            // clean up records after last sync date
                            _cleanUpRecordsFromSFDC(objType).then(function (done) {


                                deferred.notify(done);

                                // Clean up subsidiary records which including Task, Event, Note, Attachment and File link(ContentDocumentLink) of this object
                                service.cleanUpObjectSubsidiaryRecords(objType).then(function (subDone) {

                                    var processStatus = angular.copy(done);
                                    processStatus.newVisiableRecords = 0; // because the status has already been notified to parent logic, so clear it to avoid the record amount being calculated twice
                                    processStatus.dirtyRecords = 0; // because the status has already been notified to parent logic, so clear it to avoid the record amount being calculated twice

                                    // Sync down subsidiary records(Task, Event, Note, Attachment and ContentDocumentLink) process status
                                    processStatus['subsidiaryRecords'] = subDone;

                                    // Update last clean up date to local database
                                    MetaService.updateLastCleanUpDate(objType.name, objType._serverTimestamp || new Date().toISOString()).then(function () {
                                        deferred.resolve(processStatus);
                                    }, function (error) {
                                        deferred.reject(error);
                                    });
                                }, function (error) {
                                    deferred.reject(error);
                                });
                            }, function (error) {
                                deferred.reject(error);
                            }, function (progress) {
                                deferred.notify(progress);
                            });
                        }, function (error) {
                            deferred.reject(error);
                        });
                    } else {
                        deferred.resolve({
                            newVisiableRecords: 0,
                            dirtyRecords: 0
                        });
                    }

                    return deferred.promise;
                };

                /**
                 * Clean up subsidiary records which including Task, Event, Note, Attachment and File link(ContentDocumentLink) of a specific sobject from Salesforce
                 *
                 * @param {object} param specific target sobject type
                 * @returns {*}
                 */
                service.cleanUpObjectSubsidiaryRecords = function (param) {

                    var objectName = param.name;

                    var deferred = $q.defer();

                    var promises = [];

                    // get target object configuration
                    LocalDataService.queryConfiguredObjectByName(objectName).then(function (objectType) {

                        if (objectType['MobileVizArt__Enable_NotesAndAttachments__c'] || objectType['MobileVizArt__Enable_Activity__c'] || objectType['MobileVizArt__Enable_File__c']) {

                            // soql string for query target object salesforce id
                            var queryStr = generateSoqlForObject(param, 'Id');

                            // Whether setting is need to clean up Note and Attachment
                            if (objectType['MobileVizArt__Enable_NotesAndAttachments__c']) {

                                promises.push(cleanUpSubsidiaryRecords(objectType, 'Attachment', queryStr));
                                promises.push(cleanUpSubsidiaryRecords(objectType, 'Note', queryStr));
                            }

                            // Whether setting is need to clean up Task and Event
                            if (objectType['MobileVizArt__Enable_Activity__c']) {

                                promises.push(cleanUpSubsidiaryRecords(objectType, 'Task', queryStr));
                                promises.push(cleanUpSubsidiaryRecords(objectType, 'Event', queryStr));
                            }

                            // Whether setting is need to clean up File
                            if (objectType['MobileVizArt__Enable_File__c']) {

                                promises.push(cleanUpSubsidiaryFileLinkRecords(objectType, queryStr));
                            }

                            $q.all(promises).then(function (syncProcess) {
                                deferred.resolve(syncProcess);
                            }, function (err) {
                                deferred.reject(err);
                            });
                        } else {
                            deferred.resolve([]);
                        }
                    }, function (err) {
                        deferred.reject(err);
                    });

                    return deferred.promise;
                };

                /**
                 * Clean up specific subsidiary records which is one of Task, Event, Note and Attachment
                 *
                 * @param {object} objectType target related object type
                 * @param {string} subsidiaryObjectName one of Task, Event, Note and Attachment
                 * @param {string} queryStr soql string for query salesforce id of target object
                 * @returns {Promise}
                 */
                var cleanUpSubsidiaryRecords = function (objectType, subsidiaryObjectName, queryStr) {

                    var deferred = $q.defer();

                    // get the key prefix of the specific target object
                    DescribeService.getKeyPrefix(objectType.Name).then(function (parentObjectKeyPrefix) {

                        // get subsidiary object configuration
                        ConfigurationService.getBusinessObjectTypeByName(subsidiaryObjectName).then(function (subObjectType) {
                            if (subObjectType) {

                                var subsidiaryObjectType = angular.copy(subObjectType);

                                // add parent type filter condition according to target object type
                                if (subsidiaryObjectType.filterCriteria) {
                                    subsidiaryObjectType.filterCriteria += ' AND ';
                                } else {
                                    subsidiaryObjectType.filterCriteria = '';
                                }

                                var localFilterCriteria;
                                if (subsidiaryObjectName === 'Attachment' || subsidiaryObjectName === 'Note') {
                                    subsidiaryObjectType.filterCriteria += 'ParentId IN (' + queryStr + ')';
                                    localFilterCriteria = '{' + subsidiaryObjectName + ':ParentId} LIKE \'' + parentObjectKeyPrefix + '%\'';
                                } else {
                                    if (objectType.Name === 'Contact' || objectType.Name === 'Lead') {
                                        subsidiaryObjectType.filterCriteria += 'WhoId IN (' + queryStr + ')';
                                    } else {
                                        subsidiaryObjectType.filterCriteria += 'WhatId IN (' + queryStr + ')';
                                    }
                                    localFilterCriteria = '({' + subsidiaryObjectName + ':WhatId} Like \'' + parentObjectKeyPrefix + '%\' OR {'
                                        + subsidiaryObjectName + ':WhoId} Like \'' + parentObjectKeyPrefix + '%\')';
                                }

                                // get all subsidiary record ids in salesforce through rest service, maybe including multi calls
                                _getRecordsSfIds(subsidiaryObjectType).then(function (idsInSf) {

                                    // get all record ids in local smartStore
                                    LocalDataService.getAllRecordsSFIdBySoup(subsidiaryObjectName, localFilterCriteria).then(function (idsInLocal) {

                                        var notExistIds = [];
                                        var newIds = [];

                                        // compare record ids in salesforce and local, find new visible record ids and deleted record ids
                                        compareViaObjectProperty(idsInSf, idsInLocal, newIds, notExistIds);

                                        var result = {
                                            objectName: subsidiaryObjectName,
                                            newVisiableRecords: newIds.length,
                                            dirtyRecords: notExistIds.length
                                        };

                                        // sync down new visible record according to ids, maybe including multi calls
                                        _syncDownNewVisibleSubsidiaryRecord(objectType, subsidiaryObjectType, newIds).then(function () {

                                            // delete these local records which are not exist or can't be accessed in salesforce, and not active in queue
                                            _removeDirtyRecords(subsidiaryObjectName, notExistIds).then(function () {
                                                deferred.resolve(result);
                                            }, function (error) {
                                                deferred.reject(error);
                                            });
                                        }, function (error) {
                                            deferred.reject(error);
                                        });

                                    }, function (error) {
                                        deferred.reject(error);
                                    });
                                }, function (error) {
                                    deferred.reject(error);
                                });
                            } else {
                                deferred.reject('cleanUpSubsidiaryRecords not found ' + subsidiaryObjectName + ' configuration.');
                            }
                        }, function (error) {
                            deferred.reject(error);
                        });
                    }, function (error) {
                        deferred.reject(error);
                    });

                    return deferred.promise;
                };

                /**
                 * Clean up subsidiary File Link(ContentDocumentLink) records under specific object type.
                 *
                 * @param {object} objectType target related object type
                 * @param {string} queryStr soql string for query salesforce id of target object
                 * @returns {Promise}
                 */
                var cleanUpSubsidiaryFileLinkRecords = function (objectType, queryStr) {

                    var deferred = $q.defer();

                    var subsidiaryObjectName = 'ContentDocumentLink';

                    // get the key prefix of the specific target object
                    DescribeService.getKeyPrefix(objectType.Name).then(function (parentObjectKeyPrefix) {

                        // get subsidiary object configuration
                        ConfigurationService.getBusinessObjectTypeByName(subsidiaryObjectName).then(function (subObjectType) {
                            if (subObjectType) {

                                var subsidiaryObjectType = angular.copy(subObjectType);

                                // add parent type filter condition according to target object type
                                if (subsidiaryObjectType.filterCriteria) {
                                    subsidiaryObjectType.filterCriteria += ' AND ';
                                } else {
                                    subsidiaryObjectType.filterCriteria = '';
                                }

                                subsidiaryObjectType.filterCriteria += 'LinkedEntityId IN (' + queryStr + ')';
                                var localFilterCriteria = '{' + subsidiaryObjectName + ':LinkedEntityId} LIKE \'' + parentObjectKeyPrefix + '%\'';


                                // get all contentDocumentLink record ids under the specific object in salesforce through rest service, maybe including multi calls
                                _getRecordsSfIds(subsidiaryObjectType).then(function (idsInSf) {

                                    // get all record ids in local smartStore
                                    LocalDataService.getAllRecordsSFIdBySoup(subsidiaryObjectName, localFilterCriteria).then(function (idsInLocal) {

                                        var notExistIds = [];
                                        var newIds = [];

                                        // compare record ids in salesforce and local, find new visible record ids and deleted record ids
                                        compareViaObjectProperty(idsInSf, idsInLocal, newIds, notExistIds);

                                        var result = {
                                            objectName: subsidiaryObjectName,
                                            newVisiableRecords: newIds.length,
                                            dirtyRecords: notExistIds.length
                                        };

                                        // sync down new visible record according to ids, maybe including multi calls
                                        _syncDownNewVisibleSubsidiaryRecord(objectType, subsidiaryObjectType, newIds).then(function () {

                                            // delete these local records which are not exist or can't be accessed in salesforce, and not active in queue
                                            _removeDirtyRecords(subsidiaryObjectName, notExistIds).then(function () {
                                                deferred.resolve(result);
                                            }, function (error) {
                                                deferred.reject(error);
                                            });
                                        }, function (error) {
                                            deferred.reject(error);
                                        });

                                    }, function (error) {
                                        deferred.reject(error);
                                    });
                                }, function (error) {
                                    deferred.reject(error);
                                });
                            } else {
                                deferred.reject('cleanUpSubsidiaryFileLinkRecords not found ' + subsidiaryObjectName + ' configuration.');
                            }
                        }, function (error) {
                            deferred.reject(error);
                        });
                    }, function (error) {
                        deferred.reject(error);
                    });

                    return deferred.promise;
                };

                /**
                 * Clear specific subsidiary records which is one of Task, Event, Note and Attachment under the specific target object.
                 *
                 * @param {string} targetObjectName related target object name
                 * @param {string} subsidiaryObjectName one of Task, Event, Note and Attachment
                 * @returns {Promise}
                 */
                var clearSubsidiaryRecords = function (targetObjectName, subsidiaryObjectName) {

                    var deferred = $q.defer();

                    // get the key prefix of the specific target object
                    DescribeService.getKeyPrefix(targetObjectName).then(function (parentObjectKeyPrefix) {

                        var localFilterCriteria;
                        if (subsidiaryObjectName === 'Attachment' || subsidiaryObjectName === 'Note') {
                            localFilterCriteria = '{' + subsidiaryObjectName + ':ParentId} LIKE \'' + parentObjectKeyPrefix + '%\'';
                        } else {
                            localFilterCriteria = '({' + subsidiaryObjectName + ':WhatId} Like \'' + parentObjectKeyPrefix + '%\' OR {'
                                + subsidiaryObjectName + ':WhoId} Like \'' + parentObjectKeyPrefix + '%\')';
                        }

                        LocalDataService.getAllRecordsSidBySoup(subsidiaryObjectName, localFilterCriteria).then(function (sidArray) {
                            if (subsidiaryObjectName === 'Attachment') {

                                // clear attachment body before deleting attachment records
                                clearSubsidiaryRecordsFileData(subsidiaryObjectName, sidArray).then(function () {

                                    navigator.smartstore.removeFromSoup(subsidiaryObjectName, sidArray, function () {
                                        deferred.resolve(true);
                                    }, function (err) {
                                        deferred.reject(err);
                                    });
                                }, function (err) {
                                    deferred.reject(err);
                                });
                            } else {
                                navigator.smartstore.removeFromSoup(subsidiaryObjectName, sidArray, function () {
                                    deferred.resolve(true);
                                }, function (err) {
                                    deferred.reject(err);
                                });
                            }
                        }, function (err) {
                            deferred.reject(err);
                        });
                    }, function (error) {
                        deferred.reject(error);
                    });

                    return deferred.promise;
                };

                /**
                 * Clear file data of subsidiary records including Attachment and File(ContentDocument).
                 *
                 * @param {string} objectName subsidiary object name such as Attachment, ContentDocument.
                 * @param {Array} sidArray subsidiary records soup id array of specific one common target object(Attachment)
                 *
                 * @returns {Promise}
                 */
                var clearSubsidiaryRecordsFileData = function (objectName, sidArray) {
                    var deferred = $q.defer();

                    if (sidArray && sidArray.length > 0) {

                        if (objectName === 'Attachment') {

                            // clean up attachment body data from soup or file system
                            cleanUpAttachmentBodyBySid(sidArray).then(function () {
                                deferred.resolve(true);
                            }, function (err) {
                                deferred.reject(err);
                            });
                        } else if (objectName === 'ContentDocument') {

                            // clear the files in file system
                            FileService.removeFileBySids(sidArray).then(function () {
                                deferred.resolve(true);
                            }, function (err) {
                                deferred.reject(err);
                            });
                        } else {
                            deferred.reject('Not supported object type: ' + objectName);
                        }
                    } else {
                        deferred.resolve(true);
                    }

                    return deferred.promise;
                };

                /**
                 * Clean up attachment body by attachment soup id which will be deleted.
                 * The body maybe in AttachmentBody soup or file system, will both deal with it.
                 *
                 * @param {Array} sidArray attachment soup id array of specific one common target object
                 * @returns {Promise}
                 */
                var cleanUpAttachmentBodyBySid = function (sidArray) {

                    var deferred = $q.defer();

                    if (sidArray && sidArray.length > 0) {

                        // get attachment entries
                        navigator.smartstore.retrieveSoupEntries('Attachment', sidArray, function (entries) {

                            if (entries.length > 0) {
                                var attachment = entries[0];

                                // get their common target object type
                                LocalDataService.queryConfiguredObjectByName(attachment['ParentId_type']).then(function (parentObjectType) {

                                    // whether these attachment body is stored by file
                                    var isFile = !parentObjectType['MobileVizArt__Attachments_Encrypted__c'];

                                    // clear attachment body data from soup or file system
                                    clearAttachmentBodyBySid(sidArray, isFile).then(function () {
                                        deferred.resolve(true);
                                    }, function (err) {
                                        deferred.reject(err);
                                    });
                                }, function (err) {
                                    deferred.reject(err);
                                });
                            } else {
                                deferred.resolve(true);
                            }
                        }, function (err) {
                            deferred.reject(err);
                        });
                    } else {
                        deferred.resolve(true);
                    }

                    return deferred.promise;
                };

                /**
                 * Clear attachment body by attachment soup id which will be deleted.
                 * The body maybe in AttachmentBody soup or file system, will both deal with it.
                 *
                 * @param {Array} sidArray attachment soup id array
                 * @param {boolean} isFile attachment body is stored by file
                 * @returns {Promise}
                 */
                var clearAttachmentBodyBySid = function (sidArray, isFile) {

                    var deferred = $q.defer();

                    if (isFile) {
                        FileService.removeAttachmentBySids(sidArray).then(function () {
                            deferred.resolve(true);
                        }, function (err) {
                            deferred.reject(err);
                        });
                    } else {

                        // query all related AttachmentBody records soup id array
                        LocalDataService.getAllRecordsSidBySoup('AttachmentBody', '{AttachmentBody:AttachmentSid} in (' + sidArray.join(',') + ')').then(function (attachmentBodySidArray) {

                            // delete these AttachmentBody records
                            navigator.smartstore.removeFromSoup('AttachmentBody', attachmentBodySidArray, function () {
                                deferred.resolve(true);
                            }, function (err) {
                                deferred.reject(err);
                            });
                        }, function (err) {
                            deferred.reject(err);
                        });
                    }

                    return deferred.promise;
                };

                /**
                 * clean up records of a specific sobject from Salesforce
                 *
                 * @param {object} objType
                 * @returns {*}
                 */
                var _cleanUpRecordsFromSFDC = function (objType) {
                    var deferred = $q.defer();

                    // get all record ids in salesforce through rest service, maybe including multi calls
                    _getRecordsSfIds(objType).then(function (idsInSf) {

                        // get all record ids in local smartStore
                        LocalDataService.getAllRecordsSFIdBySoup(objType.name).then(function (idsInLocal) {

                            var notExistIds = [];
                            var newIds = [];

                            // compare record ids in salesforce and local, find new visible record ids and deleted record ids
                            compareViaObjectProperty(idsInSf, idsInLocal, newIds, notExistIds);
                            var result = {
                                newVisiableRecords: newIds.length,
                                dirtyRecords: notExistIds.length
                            };

                            // sync down new visible record according to ids, maybe including multi calls
                            service.syncDownRecordsByIds(objType, newIds).then(function () {

                                // delete these local records which are not exist or can't be accessed in salesforce, and not active in queue
                                _removeDirtyRecords(objType.name, notExistIds).then(function () {
                                    deferred.resolve(result);
                                }, function (error) {
                                    deferred.reject(error);
                                });
                            }, function (error) {
                                deferred.reject('_cleanUpRecordsFromSFDC error: ' + JSON.stringify(error));
                            });
                        }, function (error) {
                            deferred.reject(error);
                        });
                    }, function (error) {
                        deferred.reject(error);
                    });

                    return deferred.promise;
                };

                /**
                 * get all relative records salesforce id of a specific sobject through the Salesforce rest service
                 *
                 * @param {object} objType
                 * @param {object} [param] for recursion parameter while needing multi fetch data from salesforce.
                 * @returns {*}
                 */
                var _getRecordsSfIds = function (objType, param) {

                    if (!param) {
                        param = {
                            deferred: $q.defer(),
                            idsAsset: [],
                            payload: {
                                soql: generateSoqlForObject(objType, 'Id'),
                                objectType: objType.name,
                                pageSize: SYNC_PAGE_SIZE.CLEAN_UP_DOWNLOAD_ALL_RECORDS_ID
                            }
                        };
                    }

                    var deferred = param.deferred;
                    var idsAsset = param.idsAsset;
                    var payload = param.payload;

                    // get record ids from salesforce
                    RestService.getRecordIds(payload).then(function (response) {

                        void 0;
                        var rtIds = response.list_ids;

                        if (rtIds && rtIds.length > 0) {
                            idsAsset = idsAsset.concat(rtIds);
                            param.idsAsset = idsAsset;

                            if (rtIds.length != payload.pageSize) {
                                deferred.resolve(idsAsset);
                            } else {
                                payload.lastId = rtIds[rtIds.length - 1];

                                _getRecordsSfIds(objType, param);
                            }
                        } else {
                            deferred.resolve(idsAsset);
                        }

                    }, function (error) {
                        deferred.reject(error);
                    });

                    return deferred.promise;
                };

                /**
                 * sync down new visible Subsidiary records according to salesforce ids
                 *
                 * @param {object} objectType target object type of subsidiary records
                 * @param {object} subsidiaryObjectType subsidiary object configuration
                 * @param {Array} sfIds
                 * @returns {*}
                 */
                var _syncDownNewVisibleSubsidiaryRecord = function (objectType, subsidiaryObjectType, sfIds) {

                    var deferred = $q.defer();

                    var extendInfo, remainProperties;
                    if (subsidiaryObjectType.name === 'Attachment') {

                        var defaultBodySyncOnDemand = (objectType['MobileVizArt__Attachment_On_Demand__c'] === undefined
                        || objectType['MobileVizArt__Attachment_On_Demand__c'] === null) ? true : objectType['MobileVizArt__Attachment_On_Demand__c'];
                        remainProperties = ['_bodySynced', '_bodySyncOnDemand'];

                        extendInfo = {
                            _bodySynced: false,
                            _bodySyncOnDemand: defaultBodySyncOnDemand,
                            ParentId_type: objectType.Name
                        };
                    } else if (subsidiaryObjectType.name === 'ContentDocumentLink') {
                        extendInfo = {
                            LinkedEntityId_type: objectType.Name
                        };
                    }

                    service.syncDownRecordsByIds(subsidiaryObjectType, sfIds, extendInfo, remainProperties).then(function () {
                        deferred.resolve();
                    }, function (error) {
                        deferred.reject('_syncDownNewVisibleSubsidiaryRecord error: ' + JSON.stringify(error));
                    });

                    return deferred.promise;
                };

                /**
                 * Sync down records according to salesforce ids or specific soql which must include filter criteria ':list_id' for map to parameter 'sfIds'
                 *
                 * @param {string|object} objectType object type name(string) or object type(object) information collection object
                 * @param {Array} sfIds sync down records salesforce id array
                 * @param {object} [extendInfo] extend sync down records this parameter including properties and their value
                 * @param {string|Array} [remainProperties] remain soup properties(fields) name array, it is also one property name string
                 * @param {boolean} [returnRecords] whether resolve return these records, default not return
                 * @param {string} [soql] query soql string from salesforce, it must include ':list_id' for map to parameter 'sfIds'
                 * @param {boolean} [notStored] optional, default(undefined) stored the records which are return from salesforce into smartStore; if true,
                 *                         it will be not stored them, and resolve the return result(ignored parameter 'returnRecords')
                 * @returns {*}
                 */
                service.syncDownRecordsByIds = function (objectType, sfIds, extendInfo, remainProperties, returnRecords, soql, notStored) {
                    var deferred = $q.defer();

                    if (!sfIds || sfIds.length === 0) {
                        deferred.resolve([]);
                        return deferred.promise;
                    }

                    sfIds = angular.copy(sfIds);

                    var pageSize = SYNC_PAGE_SIZE.DOWNLOAD_RECORDS_BY_ID;
                    var objectName = (typeof objectType === 'string') ? objectType : objectType.name;

                    var payload = {
                        soql: "",
                        inFilterCriteria: {
                            list_id: ""
                        }
                    };
                    var allResult = [];

                    var syncSequential = function () {
                        var batchData = sfIds.splice(0, pageSize);

                        payload.inFilterCriteria['list_id'] = batchData.toString();

                        RestService.getRecordsByIds(payload).then(function (response) {

                            var records2Upsert = response.records;

                            if (extendInfo) {
                                for (var i = 0; i < records2Upsert.length; i++) {
                                    var item = records2Upsert[i];
                                    item = _.extend(item, extendInfo);
                                }
                            }

                            if (notStored) {
                                allResult = allResult.concat(records2Upsert);

                                if (sfIds.length === 0) {
                                    deferred.resolve(allResult);
                                } else {
                                    syncSequential();
                                }
                            } else {

                                // upsert records
                                _localSyncUpsertSoupEntriesWithExternalId(objectName, records2Upsert, remainProperties).then(function (result) {
                                    void 0;

                                    if (returnRecords) {
                                        allResult = allResult.concat(result);
                                    }

                                    if (sfIds.length === 0) {
                                        if (returnRecords) {
                                            deferred.resolve(allResult);
                                        } else {
                                            deferred.resolve();
                                        }
                                    } else {
                                        syncSequential();
                                    }
                                }, function (error) {
                                    deferred.reject(error);
                                });
                            }
                        }, function (error) {
                            deferred.reject('syncDownRecordsByIds error: ' + JSON.stringify(error));
                        });
                    };

                    if (soql) {
                        payload.soql = soql;
                        syncSequential();
                    } else if (typeof objectType === 'string') {
                        ConfigurationService.getBusinessObjectTypeByName(objectName).then(function (objType) {
                            if (objType) {
                                payload.soql = generateSoqlForObject(objType) + ' AND Id IN :list_id';

                                syncSequential();
                            } else {
                                deferred.reject('syncDownRecordsByIds error: not found the configure of ' + objectName);
                            }
                        }, function (error) {
                            deferred.reject('syncDownRecordsByIds error: ' + JSON.stringify(error));
                        });
                    } else if (typeof objectType === 'object') {
                        payload.soql = generateSoqlForObject(objectType) + ' AND Id IN :list_id';

                        syncSequential();
                    } else {
                        deferred.reject('syncDownRecordsByIds incorrect parameter objectType or soql');
                    }

                    return deferred.promise;
                };

                /**
                 * compare array a and array b, find the data of not exist in a, and find the data of not exist in b
                 * by object property
                 *
                 * @param {Array} a
                 * @param {Array} b
                 * @param {Array} extraDataInA
                 * @param {Array} extraDataInB
                 * @returns {*}
                 */
                var compareViaObjectProperty = function (a, b, extraDataInA, extraDataInB) {

                    void 0;
                    void 0;

                    var startTime = new Date().getTime();

                    var aMap = {};
                    for (var i = 0; i < a.length; i++) {
                        aMap[a[i]] = 1;
                    }

                    for (var j = 0; j < b.length; j++) {
                        if (!aMap.hasOwnProperty(b[j])) {
                            extraDataInB.push(b[j]);
                        }
                    }

                    var bMap = {};
                    for (var k = 0; k < b.length; k++) {
                        bMap[b[k]] = 1;
                    }

                    for (var l = 0; l < a.length; l++) {
                        if (!bMap.hasOwnProperty(a[l])) {
                            extraDataInA.push(a[l]);
                        }
                    }

                    var endTime = new Date().getTime();
                    void 0;
                    void 0;
                    void 0;
                    void 0;
                };


                /**
                 * remove all the dirty records of special object according to salesforce Ids or Id is null, which are not active in queue.
                 *
                 * @param {string} soupName
                 * @param {Array} sfIds
                 * @returns {*}
                 */
                var _removeDirtyRecords = function (soupName, sfIds) {
                    var deferred = $q.defer();

                    // remove inactive records according to salesforce Ids
                    _removeInactiveRecordsBySFIds(soupName, sfIds).then(function () {

                        // remove inactive records which have not salesforce Id
                        _removeInactiveLocalRecords(soupName).then(function () {
                            deferred.resolve(true);
                        }, function (error) {
                            deferred.reject(error);
                        });
                    }, function (error) {
                        deferred.reject(error);
                    });

                    return deferred.promise;
                };


                /**
                 * remove the records of special object according to salesforce Ids, which are not active in queue.
                 *
                 * @param {string} soupName
                 * @param {Array} sfIds
                 * @returns {*}
                 */
                var _removeInactiveRecordsBySFIds = function (soupName, sfIds) {
                    var deferred = $q.defer();

                    if (sfIds && sfIds.length > 0) {

                        LocalDataService.getActiveRecordsSidBySoup(soupName).then(function (activeSids) {
                            var aMap = {};
                            for (var i = 0; i < activeSids.length; i++) {
                                aMap[activeSids[i]] = 1;
                            }


                            LocalDataService.getRecordsSidBySFid(soupName, sfIds).then(function (sids) {
                                var inactiveSids = [];

                                for (var j = 0; j < sids.length; j++) {
                                    if (!aMap.hasOwnProperty(sids[j])) {
                                        inactiveSids.push(sids[j]);
                                    }
                                }

                                if (inactiveSids.length > 0) {

                                    if (soupName === 'Attachment' || soupName === 'ContentDocument') {

                                        // clear file data before deleting attachment or contentDocument records
                                        clearSubsidiaryRecordsFileData(soupName, inactiveSids).then(function () {

                                            navigator.smartstore.removeFromSoup(false, soupName, inactiveSids, function () {
                                                deferred.resolve(true);
                                            }, function (error) {
                                                deferred.reject(error);
                                            });
                                        }, function (error) {
                                            deferred.reject(error);
                                        });
                                    } else {
                                        navigator.smartstore.removeFromSoup(false, soupName, inactiveSids, function () {
                                            deferred.resolve(true);
                                        }, function (error) {
                                            deferred.reject(error);
                                        });
                                    }
                                } else {
                                    deferred.resolve(true);
                                }
                            }, function (error) {
                                deferred.reject(error);
                            });
                        }, function (error) {
                            deferred.reject(error);
                        });
                    } else {
                        deferred.resolve(true);
                    }

                    return deferred.promise;
                };


                /**
                 * remove the no salesforce id local dirty records of special object, which are not active in queue.
                 *
                 * @param {string} soupName
                 * @returns {*}
                 */
                var _removeInactiveLocalRecords = function (soupName) {
                    var deferred = $q.defer();

                    LocalDataService.getActiveRecordsSidBySoup(soupName).then(function (activeSids) {
                        var aMap = {};
                        for (var i = 0; i < activeSids.length; i++) {
                            aMap[activeSids[i]] = 1;
                        }

                        LocalDataService.getNoIdRecordsSidBySoup(soupName).then(function (sids) {
                            var inactiveSids = [];

                            for (var j = 0; j < sids.length; j++) {
                                if (!aMap.hasOwnProperty(sids[j])) {
                                    inactiveSids.push(sids[j]);
                                }
                            }

                            if (inactiveSids.length > 0) {

                                if (soupName === 'Attachment' || soupName === 'ContentDocument') {

                                    // clear file data before deleting attachment or contentDocument records
                                    clearSubsidiaryRecordsFileData(soupName, inactiveSids).then(function () {

                                        navigator.smartstore.removeFromSoup(false, soupName, inactiveSids, function () {
                                            deferred.resolve(true);
                                        }, function (error) {
                                            deferred.reject(error);
                                        });
                                    }, function (error) {
                                        deferred.reject(error);
                                    });
                                } else {
                                    navigator.smartstore.removeFromSoup(false, soupName, inactiveSids, function () {
                                        deferred.resolve(true);
                                    }, function (error) {
                                        deferred.reject(error);
                                    });
                                }
                            } else {
                                deferred.resolve(true);
                            }
                        }, function (error) {
                            deferred.reject(error);
                        });
                    }, function (error) {
                        deferred.reject(error);
                    });

                    return deferred.promise;
                };


                /**
                 * Start rebuilding local reference among objects based on SFDC id.
                 *
                 * @param {object} objectSyncWrapper
                 */
                service.startRebuildLocalReferenceForObjects = function (objectSyncWrapper) {
                    var deferred = $q.defer();

                    // Don't do rebuild if objectSyncWrapper.ignoreLocalReference is true
                    if (objectSyncWrapper.syncDownObjects.ignoreLocalReference) {
                        void 0;
                        deferred.resolve(objectSyncWrapper);
                    } else {

                        // if the object need sync down then do rebuild reference
                        var objectsNeed2RebuildReference = {}, hasObjects2RebuildReference = false;

                        // Check to see if any object needs to rebuild reference for synced up objects
                        angular.forEach(objectSyncWrapper.syncUpObjects.objectTypes, function (objectEntity) {
                            var progressObj = objectSyncWrapper.syncUpObjects.syncProgress[objectEntity.name];
                            void 0;
                            if (progressObj.status.inserted > 0 || progressObj.status.updated > 0 || progressObj.status.deleted) {
                                hasObjects2RebuildReference = true;
                                objectsNeed2RebuildReference[objectEntity.name] = objectEntity.syncUpSoupEntryIds;
                                if (objectEntity.name === 'ContentVersion') {
                                    objectsNeed2RebuildReference['ContentDocument'] = [];
                                }
                            }
                        });

                        // Check to see if any object needs to rebuild reference for synced down objects
                        angular.forEach(objectSyncWrapper.syncDownObjects.objectTypes, function (objectEntity) {
                            var progressObj = objectSyncWrapper.syncDownObjects.syncProgress[objectEntity.name];
                            void 0;
                            if (progressObj.status.total > 0) {
                                hasObjects2RebuildReference = true;
                                objectsNeed2RebuildReference[objectEntity.name] = [];
                            }
                        });

                        // Check to see if any object needs to rebuild reference for cleaned up objects
                        angular.forEach(objectSyncWrapper.cleanUpObjects.objectTypes, function (objectEntity) {
                            // TODO1: need to check syncProgress for cleanUpObjects in the future
                            var progressObj = objectSyncWrapper.cleanUpObjects.syncProgress[objectEntity.name];
                            void 0;
                            if (progressObj.status.newVisiableRecords > 0) {
                                hasObjects2RebuildReference = true;
                                objectsNeed2RebuildReference[objectEntity.name] = [];
                            }
                        });

                        if (hasObjects2RebuildReference === false) {
                            deferred.resolve(objectSyncWrapper);
                        } else {

                            // rebuild reference
                            void 0;
                            service.rebuildObjectRecordsLocalRef(objectsNeed2RebuildReference, true).then(function () {

                                // All promises are resolved, then resolve the complete sync down process
                                deferred.resolve(objectSyncWrapper);
                            }, function (err) {
                                void 0;
                                deferred.reject(err);
                            }, function (notify) {
                                if (notify) {
                                    var notifyObjName = notify['objectName'];
                                    if (objectSyncWrapper.syncDownObjects.syncProgress[notifyObjName]) {
                                        var progressObj = objectSyncWrapper.syncDownObjects.syncProgress[notifyObjName];

                                        objectSyncWrapper.reference = progressObj;

                                        //progressObj.status.referenceTotal = notify['total']; // total records
                                        objectSyncWrapper.reference.status.referenceTotal = notify['total']; // total records

                                        if (!progressObj.status.referenceSize) {
                                            //progressObj.status.referenceSize = 0;
                                            objectSyncWrapper.reference.status.referenceSize = 0;
                                        }
                                        //progressObj.status.referenceSize += notify['size']; // curent batch records
                                        objectSyncWrapper.reference.status.referenceSize += notify['size']; // curent batch records
                                    }
                                    deferred.notify(objectSyncWrapper);
                                }
                            });
                        }
                    }

                    return deferred.promise;
                };

                /**
                 * upsert records into soup according to saleforce Id
                 *
                 * @param {string} soupName
                 * @param {Array} records2Upsert
                 * @param {string|Array} [remainProperties] remain soup properties(fields) name array, it is also one property name string
                 * @returns {object} promise
                 */
                var _localSyncUpsertSoupEntriesWithExternalId = function (soupName, records2Upsert, remainProperties) {
                    var deferred = $q.defer();

                    if (soupName && records2Upsert && records2Upsert.length) {
                        if (!remainProperties) {
                            navigator.smartstore.upsertSoupEntriesWithExternalId(false, soupName, records2Upsert, 'Id', function (result) {
                                deferred.resolve(result);
                            }, function (error) {
                                deferred.reject(error);
                            });
                        } else {
                            var ids = [];
                            var recordsIdMap = {};
                            for (var i = 0; i < records2Upsert.length; i++) {
                                var item = records2Upsert[i];
                                ids.push(item['Id']);
                                recordsIdMap[item['Id']] = item;
                            }

                            // query all already exist records in local smartStore according to salesforce Id
                            // for getting their necessary remain properties values in soup
                            var sqlStr = 'select {' + soupName + ':_soup} from {' + soupName + '} where {' + soupName + ':Id} in (\'' + ids.join('\',\'') + '\')',
                                querySpec = navigator.smartstore.buildSmartQuerySpec(sqlStr, SMARTSTORE_COMMON_SETTING.PAGE_SIZE_FOR_ALL);
                            navigator.smartstore.runSmartQuery(querySpec, function (cursor) {

                                var entries = cursor.currentPageOrderedEntries;

                                if (entries && entries.length > 0) {

                                    // whether remainProperties is only one field name string, or multi fields array
                                    if (typeof remainProperties === 'string') {
                                        for (var i = 0; i < entries.length; i++) {
                                            var recordItem = entries[i][0];
                                            if (recordItem[remainProperties] !== undefined) {
                                                recordsIdMap[recordItem.Id][remainProperties] = recordItem[remainProperties];
                                            }
                                        }
                                    } else {
                                        for (var i = 0; i < entries.length; i++) {
                                            var recordItem = entries[i][0];

                                            // reset each remain proterty according to Id
                                            for (var j = 0; j < remainProperties.length; j++) {
                                                var propertyName = remainProperties[j];
                                                if (recordItem[propertyName] !== undefined) {
                                                    recordsIdMap[recordItem.Id][propertyName] = recordItem[propertyName];
                                                }
                                            }
                                        }
                                    }

                                    // Find calculated file name changes between records2Upsert and entries, and update their calculated file name in file system
                                    // When attachment Name changed, change file name in file system. Allow async.
                                    if (soupName === 'Attachment') {
                                        for (var i = 0; i < entries.length; i++) {
                                            var recordItem = entries[i][0];
                                            var newRecordItem = recordsIdMap[recordItem.Id];

                                            if (recordItem.Name !== newRecordItem.Name) {
                                                FileService.changeAttachmentFileName(recordItem._soupEntryId, recordItem.Name, newRecordItem.Name);
                                            }
                                        }
                                    }

                                    // When contentVersion Title or FileExtension changed, change file name in file system. Allow async.
                                    if (soupName === 'ContentVersion') {
                                        for (var i = 0; i < entries.length; i++) {
                                            var recordItem = entries[i][0];
                                            var newRecordItem = recordsIdMap[recordItem.Id];

                                            if (newRecordItem['IsLatest'] === true && (recordItem.Title !== newRecordItem.Title || recordItem['FileExtension'] !== newRecordItem['FileExtension'])) {
                                                FileService.changeFileName({
                                                    _soupEntryId: recordItem['ContentDocumentId_sid'],
                                                    Title: recordItem['Title'],
                                                    FileExtension: recordItem['FileExtension']
                                                }, {
                                                    _soupEntryId: recordItem['ContentDocumentId_sid'],
                                                    Title: newRecordItem['Title'],
                                                    FileExtension: newRecordItem['FileExtension']
                                                });
                                            }
                                        }
                                    }
                                }

                                // upsert the adjusted records
                                navigator.smartstore.upsertSoupEntriesWithExternalId(false, soupName, _.values(recordsIdMap), 'Id', function (result) {
                                    deferred.resolve(result);
                                }, function (error) {
                                    deferred.reject(error);
                                });
                            }, function (error) {
                                deferred.reject(error);
                            });
                        }
                    } else {
                        deferred.resolve([]);
                    }

                    return deferred.promise;
                };

                /**
                 * Remove the records in smartStore according to salesforce id, including removing special related file data
                 *
                 * @param {string} soupName
                 * @param {Array} recordIds2Delete
                 * @returns {*}
                 * @private
                 */
                var _localSyncRemoveFromSoup = function (soupName, recordIds2Delete) {

                    var deferred = $q.defer();

                    if (soupName && recordIds2Delete && recordIds2Delete.length > 0) {

                        // query soup ids of all records which will be deleted records from smartStore
                        LocalDataService.getAllRecordsSidBySoup(soupName, '{' + soupName + ':Id} in (\'' + recordIds2Delete.join('\',\'') + '\')').then(function (sidArray) {

                            if (sidArray.length) {

                                if (soupName === 'Attachment' || soupName === 'ContentDocument') {

                                    // clear file data before deleting attachment or contentDocument records
                                    clearSubsidiaryRecordsFileData(soupName, sidArray).then(function () {

                                        navigator.smartstore.removeFromSoup(false, soupName, sidArray, function () {
                                            deferred.resolve(true);
                                        }, function (error) {
                                            deferred.reject(error);
                                        });
                                    }, function (error) {
                                        deferred.reject(error);
                                    });
                                } else {
                                    navigator.smartstore.removeFromSoup(false, soupName, sidArray, function () {
                                        deferred.resolve(true);
                                    }, function (error) {
                                        deferred.reject(error);
                                    });
                                }
                            } else {
                                deferred.resolve(true);
                            }
                        }, function (error) {
                            deferred.reject(error);
                        });
                    } else {
                        deferred.resolve(true);
                    }

                    return deferred.promise;
                };

                /**
                 * generate soql string for sync down records from Salesforce
                 *
                 * @param {object} objectType
                 * @returns {string}
                 */
                var generateSoqlForSyncDown = function (objectType) {
                    return $q(function (resolve, reject) {
                        var tableName = objectType.name;
                        var fields = objectType.fields;
                        var filterCriteria = objectType.filterCriteria;
                        var lookupModStamp = objectType.lookupModStamp;
                        var lastSyncDownDate = objectType.lastSyncDownDate;
                        var serverTimestamp = objectType._serverTimestamp;

                        var queryStr = 'SELECT ' + fields.toString() + ' FROM ' + tableName;

                        var whereClause = null, resolveObjectInSearchFieldPermissionPromise = null;

                        // filter data before last sync down date
                        // for each lookupmoddate, needs a sub where statement like (lookupModStamp > lastSyncDownDate AND lookupModStamp <= serverTimestamp)
                        // and use "or" to concatenate them
                        if (lastSyncDownDate) {
                            if (lookupModStamp == null || lookupModStamp.length === 0) {
                                whereClause = 'SystemModStamp > [LAST_SYNC_DATE] AND SystemModStamp <= [SERVER_TIME_STAMP]';
                            } else {
                                // load object permissions, if the current user has no read permission of the object in object-home field path, ignore the object-home field
                                resolveObjectInSearchFieldPermissionPromise = $q(function (resolveObjectInSearchFieldPermissionResolve, resolveObjectInSearchFieldPermissionReject) {
                                    MetaService.getMetaValue('objectPermissions').then(function (objectPermissions) {
                                        var objectHasReadPermissions = [];
                                        for (var objectName in objectPermissions) {
                                            if (objectPermissions.hasOwnProperty(objectName)) {
                                                if (objectPermissions[objectName]['PermissionsRead'] === true && objectHasReadPermissions.indexOf(objectName) === -1) {
                                                    objectHasReadPermissions.push(objectName);
                                                }
                                            }
                                        }

                                        void 0;

                                        // for comma separated value, e.g., Account__r.SystemModStamp,SystemModstamp
                                        var lookupModStampArr = lookupModStamp.split(','), lookupFieldNames = [];

                                        var checkLookupObjectReadPermissions = [];
                                        angular.forEach(lookupModStampArr, function (item) {
                                            item = item.trim();

                                            checkLookupObjectReadPermissions.push($q(function (innnerResolve, innerReject) {

                                                var checkFieldReferenceToObjectPermission = function (fieldOnObjectName, cascadeFields, checkIndex) {
                                                    fieldOnObjectName = fieldOnObjectName || tableName;

                                                    var fieldName = cascadeFields[checkIndex];
                                                    // custom object: Contact.test_object__r.Name
                                                    if (_.endsWith(fieldName, '__r')) {
                                                        fieldName = fieldName.substring(0, fieldName.length - 1) + 'c';
                                                    } else if (!_.endsWith(fieldName, 'Id')) {
                                                        fieldName += 'Id';
                                                    }

                                                    var checkFieldReferenceToObjectPermissionDefer = $q.defer();

                                                    DescribeService.getDescribeSObject(fieldOnObjectName).then(function (objectDescribe) {
                                                        var lookupObjectNames = _.result(_.find(objectDescribe.fields, 'name', fieldName), 'referenceTo');

                                                        if (lookupObjectNames && lookupObjectNames.length > 0) {
                                                            fieldOnObjectName = lookupObjectNames[0];
                                                            // dosen't has permission
                                                            if (objectHasReadPermissions.indexOf(lookupObjectNames[0]) === -1) {
                                                                checkFieldReferenceToObjectPermissionDefer.resolve(false);
                                                            } else {
                                                                // custom object: Contact.test_object__r.Name
                                                                if (cascadeFields.length > (checkIndex + 2)) {
                                                                    checkIndex++;
                                                                    void 0;
                                                                    checkFieldReferenceToObjectPermission(fieldOnObjectName, cascadeFields, checkIndex).then(
                                                                        checkFieldReferenceToObjectPermissionDefer.resolve,
                                                                        checkFieldReferenceToObjectPermissionDefer.reject
                                                                    );
                                                                } else {
                                                                    checkFieldReferenceToObjectPermissionDefer.resolve(true);
                                                                }

                                                            }
                                                        } else {
                                                            // ignore
                                                            checkFieldReferenceToObjectPermissionDefer.resolve(false);
                                                        }


                                                    }, checkFieldReferenceToObjectPermissionDefer.reject);

                                                    return checkFieldReferenceToObjectPermissionDefer.promise;
                                                };


                                                if (item.indexOf('.') > -1) {
                                                    var cascadeFields = item.split('.');
                                                    checkFieldReferenceToObjectPermission(tableName, cascadeFields, 0).then(function (hasPermission) {
                                                        if (hasPermission === true && lookupFieldNames.indexOf(item) === -1) {
                                                            lookupFieldNames.push(item);
                                                        }

                                                        innnerResolve(true);
                                                    }, innerReject);

                                                } else {
                                                    if (lookupFieldNames.indexOf(item) === -1) {
                                                        lookupFieldNames.push(item);
                                                    }
                                                    innnerResolve(true);
                                                }
                                            }));
                                        });

                                        $q.all(checkLookupObjectReadPermissions).then(function () {

                                            for (var i = 0; i < lookupFieldNames.length; i++) {
                                                var fieldName = lookupFieldNames[i];

                                                if (!whereClause) {
                                                    whereClause = '(';
                                                }

                                                if (serverTimestamp) {
                                                    whereClause += '(' + fieldName + '> [LAST_SYNC_DATE] AND ' + fieldName + ' <= [SERVER_TIME_STAMP]) OR ';
                                                } else {
                                                    whereClause += fieldName + '> [LAST_SYNC_DATE] OR ';
                                                }
                                            }

                                            if (whereClause && _.endsWith(whereClause.trim(), 'OR')) {
                                                whereClause = whereClause.substring(0, whereClause.length - 3); // remove last OR
                                                whereClause += ')';
                                            }

                                            resolveObjectInSearchFieldPermissionResolve(true);
                                        }, resolveObjectInSearchFieldPermissionReject);
                                    }, resolveObjectInSearchFieldPermissionReject);
                                });
                            }
                        } else {
                            whereClause = 'SystemModStamp <= [SERVER_TIME_STAMP]';
                        }

                        var handleGenerateSoqlResult = function () {
                            if (lastSyncDownDate) {
                                // assume the lastSyncDownDate is always a gmt date
                                //lastSyncDownDate = lastSyncDownDate.replace('+0000', 'Z');
                                whereClause = whereClause.replace(/\[LAST_SYNC_DATE\]/g, lastSyncDownDate);
                            }

                            if (serverTimestamp) {
                                // assume the serverTimestamp is always a gmt date
                                //serverTimestamp = serverTimestamp.replace('+0000', 'Z');
                                whereClause = whereClause.replace(/\[SERVER_TIME_STAMP\]/g, serverTimestamp);
                            }

                            // add custom filter criteria
                            if (filterCriteria != null && filterCriteria.length > 0) {

                                if (whereClause == null) {
                                    whereClause = filterCriteria;
                                } else {
                                    whereClause += ' AND ' + filterCriteria;
                                }
                            }

                            if (whereClause != null) {
                                queryStr += ' WHERE ' + whereClause;
                            }

                            void 0;
                            resolve(queryStr);
                        };

                        if (resolveObjectInSearchFieldPermissionPromise) {
                            resolveObjectInSearchFieldPermissionPromise.then(function () {
                                handleGenerateSoqlResult();
                            }, reject);
                        } else {
                            handleGenerateSoqlResult();
                        }
                    });
                };

                /**
                 * Sync up records of a specific sobject to Salesforce
                 *
                 * @param {string} objectType
                 * @returns {*}
                 */
                service.syncUpObjectRecords = function (objectType) {

                    void 0;

                    // TODO: 1. last sync up date should use server time
                    // TODO: 2. update lookup field id for child records after new parent records are uploaded and getting SFDC ids
                    // TODO: 3. only upload writable fields (writable objects are filtered when initiailizing objects for sync up)
                    // TODO: 4. add test data and test the complete logic
                    // TODO: 5. add status to progress page
                    // TODO: 6. further requirements inherient from Flex version
                    // TODO: 7. support delete operation

                    // Deal with all operations of a specific object
                    var deferred = $q.defer();
                    var records2Insert = [];
                    var records2Update = [];
                    var records2Delete = [];

                    // Query all queue messages from the queue
                    var querySpec = navigator.smartstore.buildExactQuerySpec('objectName', objectType.name, SMARTSTORE_COMMON_SETTING.PAGE_SIZE_FOR_ALL);
                    navigator.smartstore.querySoup(SMARTSTORE_COMMON_SETTING.SOUP_NAME_QUEUE, querySpec, function (cursor) {

                        var currentPageEntries = cursor.currentPageOrderedEntries;

                        // Categories messages by action (insert, update or delete)
                        angular.forEach(currentPageEntries, function (entry) {
                            if (entry.action === SMARTSTORE_COMMON_SETTING.QUEUE_MESSAGE_ACTION_INSERT) {
                                records2Insert.push(entry);
                            } else if (entry.action === SMARTSTORE_COMMON_SETTING.QUEUE_MESSAGE_ACTION_UPDATE) {
                                records2Update.push(entry);
                            } else if (entry.action === SMARTSTORE_COMMON_SETTING.QUEUE_MESSAGE_ACTION_DELETE) {
                                records2Delete.push(entry);
                            }
                        });

                        void 0;
                        void 0;
                        void 0;

                        // Sync up insert records
                        syncUpInsertRecords(objectType.name, records2Insert).then(function (result) {

                            // Sync up insert records finishes, notify current result
                            void 0;
                            deferred.notify(result);

                            // Sync up update records
                            syncUpUpdateRecords(objectType.name, records2Update).then(function (result) {

                                // Sync up update records finishes, notify current result
                                void 0;
                                deferred.notify(result);

                                // Sync up delete records
                                syncUpDeleteRecords(objectType.name, records2Delete).then(function (result) {

                                    // Sync up delete records finishes, notify current result
                                    void 0;
                                    deferred.notify(result);

                                    // Update last sync up date and resolve sync operation
                                    MetaService.updateLastSyncUpDate(objectType.name, objectType._serverTimestamp || new Date().toISOString()).then(function () {
                                        void 0;
                                        deferred.resolve(result);
                                    }, function (error) {
                                        deferred.reject(error);
                                    });

                                }, function (error) {
                                    deferred.reject(error);
                                }, function (notify) {
                                    deferred.notify(notify);
                                });

                            }, function (error) {
                                deferred.reject(error);
                            }, function (notify) {
                                deferred.notify(notify);
                            });
                        }, function (error) {
                            deferred.reject(error);
                        }, function (notify) {
                            deferred.notify(notify);
                        });

                    }, function (error) {
                        deferred.reject(error);
                    });

                    return deferred.promise;
                };

                /**
                 * Sync up insert records.
                 *
                 * @param   {string} objectName     the object name
                 * @param   {array} messageRecords the queue message of the object
                 * @returns {promise}
                 */
                var syncUpInsertRecords = function (objectName, messageRecords) {

                    var deferred = $q.defer();

                    // If no message records, return
                    if (!messageRecords || messageRecords.length == 0) {
                        deferred.resolve(createSyncUpDefaultResult(objectName, SMARTSTORE_COMMON_SETTING.QUEUE_MESSAGE_ACTION_INSERT));
                        return deferred.promise;
                    }

                    // Query all related records of the queue messages
                    queryRelatedRecords(messageRecords).then(function (result) {

                        // Create param for insertion
                        var param4Insert = {
                            objectType: objectName,
                            operationType: SMARTSTORE_COMMON_SETTING.QUEUE_MESSAGE_ACTION_INSERT,
                            records: result.records,
                            queueMessages: result.queueMessages
                        };

                        if (objectName === 'Attachment' || objectName === 'ContentVersion') {

                            lookupSFDCReference(objectName, param4Insert.records, param4Insert.operationType).then(function () {

                                if (objectName === 'Attachment') {

                                    // sync up new attachment records including body to salesforce one by one
                                    syncUpNewAttachmentRecords(param4Insert).then(function (result) {
                                        deferred.resolve(result);
                                    }, function (error) {
                                        deferred.reject(error);
                                    }, function (notify) {
                                        deferred.notify(notify);
                                    });
                                } else if (objectName === 'ContentVersion') {

                                    // sync up new contentVersion records including versionData to salesforce one by one
                                    syncUpNewContentVersionRecords(param4Insert).then(function (result) {
                                        deferred.resolve(result);
                                    }, function (error) {
                                        deferred.reject(error);
                                    }, function (notify) {
                                        deferred.notify(notify);
                                    });
                                } else {
                                    deferred.reject('Not supported object type.');
                                }
                            }, function (error) {
                                deferred.reject(error);
                            });
                        } else {

                            // Sync to SFDC
                            synchronizeToSFDC(param4Insert).then(function (result) {
                                deferred.resolve(result);
                            }, function (error) {
                                deferred.reject(error);
                            }, function (notify) {
                                deferred.notify(notify);
                            });
                        }
                    }, function (error) {
                        deferred.reject(error);
                    });

                    return deferred.promise;
                };

                /**
                 * Sync up new Attachment records including body one by one.
                 *
                 * @param   {Object} param param the param object for sync.
                 * @param   {object} [syncUpProcess] - the first page doesn't need this parameter, but following pages need this when the method is invoked recursively
                 * @param   {object} [deferred] - the first page doesn't need this parameter, but following pages need this when the method is invoked recursively
                 * @returns {promise}
                 */
                var syncUpNewAttachmentRecords = function (param, syncUpProcess, deferred) {

                    var objectName = param.objectType;
                    var attachmentRecords = param.records;
                    var messageRecords = param.queueMessages;
                    var currentIndex = param.currentIndex == undefined ? 0 : param.currentIndex + 1;
                    param.currentIndex = currentIndex;

                    deferred = deferred || $q.defer();

                    // initialize syncUpProcess at first time when it is null
                    if (!syncUpProcess) {
                        syncUpProcess = createSyncUpDefaultResult(objectName, SMARTSTORE_COMMON_SETTING.QUEUE_MESSAGE_ACTION_INSERT);
                        syncUpProcess['total'] = messageRecords.length;
                    }

                    var actionBeforeResolve = function () {
                        var ids = _.pluck(attachmentRecords, 'Id');

                        // update the attachment records including new salesforce id
                        navigator.smartstore.upsertSoupEntries('Attachment', attachmentRecords, function () {

                            // update the attachment records with new status '_bodySynced'=true in smartStore by data get from salesforce
                            service.syncDownRecordsByIds('Attachment', ids, {_bodySynced: true}).then(function () {
                                deferred.resolve(syncUpProcess);
                            }, function (error) {
                                deferred.reject('syncUpNewAttachmentRecords error: ' + JSON.stringify(error));
                            });
                        });
                    };

                    // start sync up one by one
                    var queueMessage = messageRecords[currentIndex];
                    var attachment = attachmentRecords[currentIndex];

                    if (queueMessage && attachment) {

                        // Common error operation collection including notifying process, updating queue message(allowed async),
                        // and processing next one deal or returning result.
                        var commonErrorOperation = function (err) {
                            syncUpProcess['failed'] += 1;

                            _updateQueueMessage(queueMessage, err);

                            if (currentIndex <= messageRecords.length - 1) {
                                deferred.notify(syncUpProcess);

                                syncUpNewAttachmentRecords(param, syncUpProcess, deferred);
                            } else {
                                actionBeforeResolve();
                            }
                        };

                        // sync up new attachment record to salesforce one by one through calling rest api
                        if (attachment['ParentId_type']) {
                            LocalDataService.queryConfiguredObjectByName(attachment['ParentId_type']).then(function (relatedObjectType) {

                                // get Attachment body from soup or file system
                                FileService.getAttachmentBody(attachment, relatedObjectType).then(function (bodyContent) {

                                    // call rest api to create attachment record in salesforce
                                    SalesforceDataService.createAttachment(attachment['ParentId'], attachment['Name'], attachment['Description'], bodyContent, attachment['ContentType']).then(function (result) {

                                        if (result['success']) {
                                            attachment['Id'] = result['id'];

                                            // remove queue message when success
                                            navigator.smartstore.removeFromSoup(SMARTSTORE_COMMON_SETTING.SOUP_NAME_QUEUE, [queueMessage._soupEntryId], function () {

                                                if (currentIndex <= messageRecords.length - 1) {
                                                    syncUpProcess['processed'] += 1;
                                                    deferred.notify(syncUpProcess);

                                                    syncUpNewAttachmentRecords(param, syncUpProcess, deferred);
                                                } else {
                                                    actionBeforeResolve();
                                                }
                                            });
                                        } else {
                                            commonErrorOperation(result['errors'] + '');
                                        }
                                    }, function (err) {
                                        commonErrorOperation(err);
                                    });
                                }, function (err) {
                                    commonErrorOperation(err);
                                });
                            }, function (err) {
                                commonErrorOperation(err);
                            });
                        } else {
                            commonErrorOperation('The related object type of the Attachment record is undefined, please define the ParentId_type field.');
                        }
                    } else {
                        actionBeforeResolve();
                    }

                    return deferred.promise;
                };

                /**
                 * Sync up new version File records including versionData one by one.
                 *
                 * @param   {Object} param param the param object for sync.
                 * @param   {object} [syncUpProcess] - the first page doesn't need this parameter, but following pages need this when the method is invoked recursively
                 * @param   {object} [deferred] - the first page doesn't need this parameter, but following pages need this when the method is invoked recursively
                 * @returns {promise}
                 */
                var syncUpNewContentVersionRecords = function (param, syncUpProcess, deferred) {

                    var objectName = param.objectType;
                    var contentVersionRecords = param.records;
                    var messageRecords = param.queueMessages;
                    var currentIndex = param.currentIndex == undefined ? 0 : param.currentIndex + 1;
                    param.currentIndex = currentIndex;

                    deferred = deferred || $q.defer();

                    // initialize syncUpProcess at first time when it is null
                    if (!syncUpProcess) {
                        syncUpProcess = createSyncUpDefaultResult(objectName, SMARTSTORE_COMMON_SETTING.QUEUE_MESSAGE_ACTION_INSERT);
                        syncUpProcess['total'] = messageRecords.length;
                    }

                    var actionBeforeResolve = function () {
                        var ids = _.pluck(contentVersionRecords, 'Id');

                        // update new contentVersion including new salesforce id
                        navigator.smartstore.upsertSoupEntries('ContentVersion', contentVersionRecords, function () {

                            // update contentVersion with new status '_versionDataSynced'=true in smartStore by data get from salesforce,
                            // and update all related contentDocument and contentDocumentLink data
                            updateNewContentVersionRecords(ids).then(function () {
                                deferred.resolve(syncUpProcess);
                            }, function (error) {
                                deferred.reject('syncUpNewContentVersionRecords error: ' + JSON.stringify(error));
                            });
                        });
                    };

                    // start sync up one by one
                    var queueMessage = messageRecords[currentIndex];
                    var contentVersion = contentVersionRecords[currentIndex];

                    if (queueMessage && contentVersion) {

                        // Common error operation collection including notifying process, updating queue message(allowed async),
                        // and processing next one deal or returning result.
                        var commonErrorOperation = function (err) {
                            syncUpProcess['failed'] += 1;

                            _updateQueueMessage(queueMessage, err);

                            if (currentIndex <= messageRecords.length - 1) {
                                deferred.notify(syncUpProcess);

                                syncUpNewContentVersionRecords(param, syncUpProcess, deferred);
                            } else {
                                actionBeforeResolve();
                            }
                        };

                        // get file data from file system
                        FileService.getFileData({_soupEntryId: contentVersion['ContentDocumentId_sid']}).then(function (bodyContent) {

                            // call rest api to create ContentVersion record in salesforce,
                            // in this process include creating or updating ContentDocument and ContentDocumentLink records(ShareType='I')
                            SalesforceDataService.createContentVersion(contentVersion['ContentDocumentId'], bodyContent, contentVersion['PathOnClient'], contentVersion['Title'], contentVersion['Description'], contentVersion['NetworkId']).then(function (result) {

                                if (result['success']) {
                                    contentVersion['Id'] = result['id'];

                                    // remove queue message when success
                                    navigator.smartstore.removeFromSoup(SMARTSTORE_COMMON_SETTING.SOUP_NAME_QUEUE, [queueMessage._soupEntryId], function () {

                                        if (currentIndex <= messageRecords.length - 1) {
                                            syncUpProcess['processed'] += 1;
                                            deferred.notify(syncUpProcess);

                                            syncUpNewContentVersionRecords(param, syncUpProcess, deferred);
                                        } else {
                                            actionBeforeResolve();
                                        }
                                    });
                                } else {
                                    commonErrorOperation(result['errors'] + '');
                                }
                            }, function (err) {
                                commonErrorOperation(err);
                            });
                        }, function (err) {
                            commonErrorOperation(err);
                        });
                    } else {
                        actionBeforeResolve();
                    }

                    return deferred.promise;
                };

                /**
                 * Update new version File records after sync up finished.
                 * @param   {Array} sfIds new contentVersion salesforce id array which have already finished sync up.
                 * @returns {promise}
                 */
                var updateNewContentVersionRecords = function (sfIds) {

                    var deferred = $q.defer();

                    // sync down all new created ContentVersion records
                    service.syncDownRecordsByIds('ContentVersion', sfIds, {_versionDataSynced: true}, 'ContentDocumentId_sid', true).then(function (newContentVersions) {
                        var contentDocumentSids = _.pluck(newContentVersions, 'ContentDocumentId_sid');

                        // query related contentDocument records
                        navigator.smartstore.retrieveSoupEntries('ContentDocument', contentDocumentSids, function (entries) {

                            // update Id field of contentDocument records, if it is new created at first time
                            for (var i = 0; i < entries.length; i++) {
                                var contentDocument = entries[i];
                                if (!contentDocument['Id']) {
                                    var contentVersion = _.findWhere(newContentVersions, {ContentDocumentId_sid: contentDocument._soupEntryId});
                                    contentDocument['Id'] = contentVersion['ContentDocumentId'];
                                }
                            }

                            navigator.smartstore.upsertSoupEntries('ContentDocument', entries, function (newContentDocuments) {
                                var contentDocumentIds = _.pluck(newContentDocuments, 'Id');

                                // sync down all related ContentDocument records, and store them in smartStore
                                service.syncDownRecordsByIds('ContentDocument', contentDocumentIds).then(function () {

                                    deferred.resolve();

                                    // get ContentDocumentLink object configuration
                                    //ConfigurationService.getBusinessObjectTypeByName('ContentDocumentLink').then(function (contentDocumentLinkConfig) {
                                    //
                                    //    var joinSep = '\', \'';
                                    //
                                    //    contentDocumentLinkConfig = angular.copy(contentDocumentLinkConfig);
                                    //    // TODO: contentDocumentIds maybe have large data, then soql is too long
                                    //    contentDocumentLinkConfig.filterCriteria = 'ContentDocumentId IN (\'' + contentDocumentIds.join(joinSep) + '\')';
                                    //
                                    //    var soql = generateSoqlForObject(contentDocumentLinkConfig);
                                    //
                                    //    // get all new related ContentDocumentLink records
                                    //    SalesforceDataService.queryAll(soql).then(function (result) {
                                    //
                                    //        // upsert all related contentDocumentLink records
                                    //        _localSyncUpsertSoupEntriesWithExternalId('ContentDocumentLink', result).then(function () {
                                    //            deferred.resolve();
                                    //        });
                                    //    });
                                    //});
                                }, function (error) {
                                    deferred.reject('_syncDownNewVisibleSubsidiaryRecord error: ' + JSON.stringify(error));
                                });
                            });
                        });
                    }, function (error) {
                        deferred.reject('_syncDownNewVisibleSubsidiaryRecord error: ' + JSON.stringify(error));
                    });

                    return deferred.promise;
                };

                /**
                 * Update the error content of the queue message, allowed async
                 *
                 * @param {object} queueMessage
                 * @param {string} errorMsg
                 */
                var _updateQueueMessage = function (queueMessage, errorMsg) {

                    queueMessage.state = 'error';
                    queueMessage.error = errorMsg;

                    // Update messages (allowed async)
                    navigator.smartstore.upsertSoupEntries(SMARTSTORE_COMMON_SETTING.SOUP_NAME_QUEUE, [queueMessage], function (success) {
                        void 0;
                    }, function (error) {
                        // TODO: handle exception
                    });
                };

                /**
                 * Sync up update records.
                 *
                 * @param   {string} objectName     the object name
                 * @param   {array} messageRecords the queue message of the object
                 * @returns {promise}
                 */
                var syncUpUpdateRecords = function (objectName, messageRecords) {

                    var deferred = $q.defer();

                    // If no message records, return
                    if (!messageRecords || messageRecords.length == 0) {
                        deferred.resolve(createSyncUpDefaultResult(objectName, SMARTSTORE_COMMON_SETTING.QUEUE_MESSAGE_ACTION_UPDATE));
                        return deferred.promise;
                    }

                    // Deal with update operation
                    queryRelatedRecords(messageRecords).then(function (result) {

                        // Create param for updating
                        var param4Update = {
                            objectType: objectName,
                            operationType: SMARTSTORE_COMMON_SETTING.QUEUE_MESSAGE_ACTION_UPDATE,
                            records: result.records,
                            queueMessages: result.queueMessages
                        };

                        // Sync to SFDC
                        synchronizeToSFDC(param4Update).then(function (result) {
                            deferred.resolve(result);
                        }, function (error) {
                            deferred.reject(error);
                        }, function (notify) {
                            deferred.notify(notify);
                        });
                    }, function (error) {
                        deferred.reject(error);
                    });

                    return deferred.promise;
                };

                /**
                 * Sync up delete records.
                 *
                 * @param   {string} objectName     the object name
                 * @param   {array} messageRecords the queue message of the object
                 * @returns {promise}
                 */
                var syncUpDeleteRecords = function (objectName, messageRecords) {
                    var deferred = $q.defer(),
                        records2Delete = [];

                    // If no message records, return
                    if (!messageRecords || messageRecords.length == 0) {
                        deferred.resolve(createSyncUpDefaultResult(objectName, SMARTSTORE_COMMON_SETTING.QUEUE_MESSAGE_ACTION_DELETE));
                        return deferred.promise;
                    }

                    angular.forEach(messageRecords, function (messageRecord) {
                        records2Delete.push({Id: messageRecord.sfdcId});
                    });

                    // Deal with delete operation
                    // Create param for deleting
                    var param4Delete = {
                        objectType: objectName,
                        operationType: SMARTSTORE_COMMON_SETTING.QUEUE_MESSAGE_ACTION_DELETE,
                        records: records2Delete,
                        queueMessages: messageRecords
                    };

                    // Sync to SFDC
                    synchronizeToSFDC(param4Delete).then(function (result) {
                        deferred.resolve(result);
                    }, function (error) {
                        deferred.reject(error);
                    }, function (notify) {
                        deferred.notify(notify);
                    });

                    return deferred.promise;
                };

                /**
                 * Create a default sync up result.
                 *
                 * @param   {string} objectName    the object name
                 * @param   {string} operationType the operation type, e.g, insert, update or delete
                 * @returns {promise}
                 */
                var createSyncUpDefaultResult = function (objectName, operationType) {
                    return {
                        objectType: objectName,
                        operationType: operationType,
                        processed: 0,
                        failed: 0,
                        total: 0
                    };
                };

                /**
                 * Query sobjects according the queue messages.
                 *
                 * @param   {array} queueMessages queue messages
                 * @returns {array} sobjects of the corresponding queue messages
                 */
                var queryRelatedRecords = function (queueMessages) {

                    void 0;

                    // Assume queueMessages are relating to the same object
                    var deferred = $q.defer();
                    var records = [];
                    var recordsQueueMessages = [];

                    queryQueuedRecords(queueMessages[0].objectName, _.pluck(queueMessages, 'recordSoupEntryId')).then(function (result) {

                        for (var i = 0; i < result.length; i++) {
                            var entry = result[i];
                            var queueMessage = _.findWhere(queueMessages, {recordSoupEntryId: entry._soupEntryId});
                            if (queueMessage) {
                                records.push(entry);
                                recordsQueueMessages.push(queueMessage);
                            }
                        }

                        deferred.resolve({records: records, queueMessages: recordsQueueMessages});
                    }, function (error) {
                        deferred.reject(error);
                    });

                    return deferred.promise;
                };

                /**
                 * Multiply query the business object records in the queue according to the possible large amount of filter _soupEntryId array,
                 * return the concat collection of their result.
                 *
                 * @param {string} sObjectName
                 * @param {Array} queuedRecordIds
                 * @returns {*|promise}
                 */
                function queryQueuedRecords(sObjectName, queuedRecordIds) {
                    var deferred = $q.defer();
                    var perSize = 1000;
                    var result = [];

                    var perQuery = function (arr) {
                        var smartSql = 'select {' + sObjectName + ':_soup} from {' + sObjectName + '} where {'
                            + sObjectName + ':_soupEntryId} in (' + queuedRecordIds.splice(0, perSize).join(',') + ')';
                        var querySpec = navigator.smartstore.buildSmartQuerySpec(smartSql, SMARTSTORE_COMMON_SETTING.PAGE_SIZE_FOR_ALL);
                        navigator.smartstore.runSmartQuery(querySpec, function (cursor) {
                            result = result.concat(cursor.currentPageOrderedEntries);
                            if (arr.length > 0) {
                                perQuery(arr);
                            } else {
                                deferred.resolve(_.pluck(result, '0'));
                            }
                        }, function (error) {
                            void 0;
                            deferred.reject(error);
                        });
                    };

                    perQuery(queuedRecordIds);

                    return deferred.promise;
                }

                /**
                 * Sync records to SFDC.
                 *
                 * @param   {Object} param the param object for sync.
                 * @returns {Promise}
                 */
                var synchronizeToSFDC = function (param) {

                    void 0;

                    var deferred = param.deferred || $q.defer();
                    var forceClient = ForceClientService.getForceClient();
                    var objectType = param.objectType;
                    var operationType = param.operationType;
                    var records = param.records;
                    var queueMessages = param.queueMessages;
                    var processed = param.processed || 0;
                    var failed = param.failed || 0;
                    var successSoupEntryIds = param.successSoupEntryIds || [];
                    var total = param.total || param.records.length;
                    var done = param.done || false;
                    var size = SYNC_PAGE_SIZE.SYNC_UP_RECORDS;

                    // each sync deal with records specified by size, the rest are in the next execution
                    if (records) {
                        records = param.records.splice(0, size);
                    }

                    var queueTimestamps = [];
                    if (queueMessages) {
                        queueMessages = param.queueMessages.splice(0, size);
                        queueTimestamps = _.pluck(queueMessages, '_soupLastModifiedDate');
                    }

                    // Lookup SFDC reference according to _sid
                    // Create new records element in the array only keep writable fields
                    LocalDataService.soqlFieldsForObjectType(objectType).then(function (queryFields) {
                        adjustSyncUpRecords(objectType, records, operationType).then(function (newRecords) {
                            var payload = {
                                req: {
                                    objectType: objectType,
                                    operationType: operationType,
                                    recordsJsonStr: JSON.stringify(newRecords),
                                    selectedFields: queryFields.join(','),
                                    queueTimestamps: queueTimestamps
                                }
                            };

                            void 0;

                            // synchronization records to salesforce
                            RestService.syncRecordsToSfdc(payload).then(function (result) {
                                void 0;

                                // Create param for next execution if needed
                                var nextParam = {
                                    objectType: objectType,
                                    operationType: operationType,
                                    records: param.records,
                                    queueMessages: param.queueMessages,
                                    processed: processed,
                                    failed: failed,
                                    successSoupEntryIds: successSoupEntryIds,
                                    total: total,
                                    deferred: deferred
                                };

                                // Count success and failed summary and asynchronous reset local data by synchronization result from salesforce
                                var summaryResult = resetLocalDataBySyncResult(objectType, operationType, queueMessages, result, records);

                                nextParam.processed += records.length;
                                nextParam.failed += summaryResult.failed;
                                nextParam.successSoupEntryIds = nextParam.successSoupEntryIds.concat(summaryResult.successSoupEntryIds);

                                if (param.records.length === 0) {

                                    // No more queue messages need to be synced
                                    nextParam.done = true;
                                    deferred.resolve(nextParam);
                                } else {

                                    // Call next execution
                                    deferred.notify(nextParam);
                                    synchronizeToSFDC(nextParam);
                                }

                            }, function (error) {
                                deferred.reject(error);
                            });

                        }, function (error) {
                            deferred.reject(error);
                        });
                    }, function (err) {
                        deferred.reject(err);
                    });


                    return deferred.promise;
                };

                /**
                 * Asynchronous resetting local smartStore data by synchronization result from salesforce, and return success and failed records summary.
                 * Resetting local data as below:
                 * 1. Delete the queue messages which is synchronized to salesforce successfully.
                 * 2. Update the queue messages whose related records occurs errors while synchronization to salesforce.
                 * 3. Update the local business object records salesforce Id by new gotten Id while creating.
                 *
                 * @param   {string} objectType the object type name.
                 * @param   {string} operationType the operation type of the records.
                 * @param   {array} queueMessages queue message array.
                 * @param   {object} syncResults the synchronization result to salesforce after calling Rest API.
                 * @param   {array} records local smartStore data records of this object.
                 *
                 * @returns {object} such as: { success : 0, failed : 0}
                 */
                var resetLocalDataBySyncResult = function (objectType, operationType, queueMessages, syncResults, records) {
                    var summaryResult = {
                        success: 0,
                        failed: 0,
                        successSoupEntryIds: []
                    };

                    var detailResults = [];

                    if (operationType !== SMARTSTORE_COMMON_SETTING.QUEUE_MESSAGE_ACTION_DELETE) {
                        detailResults = syncResults['upsertResults'];
                    } else {
                        detailResults = syncResults['deleteResults'];
                    }

                    // SFDC rest call successfully
                    if (syncResults.success) {

                        var removeQueues = [];
                        var updateQueues = [];
                        var updateRecords = [];
                        var removeRecords = [];

                        // Iteration per business object record,
                        // then get its related queue message record and synchronization it result from salesforce.
                        angular.forEach(records, function (record, index) {
                            var queueMessage = queueMessages[index];
                            var syncResult = detailResults[index];

                            if (syncResult.isSuccess) {

                                // Update success count
                                summaryResult.success += 1;

                                if (operationType !== SMARTSTORE_COMMON_SETTING.QUEUE_MESSAGE_ACTION_DELETE) {
                                    if (syncResult.isOnlineDeleted === true) {
                                        removeRecords.push(record._soupEntryId);
                                    } else {
                                        var recordInSyncResult = syncResult.record;
                                        if (recordInSyncResult) {
                                            record = angular.extend(record, recordInSyncResult);
                                            updateRecords.push(record);
                                        }
                                        summaryResult.successSoupEntryIds.push(record._soupEntryId);
                                    }
                                }

                                removeQueues.push(queueMessage._soupEntryId);
                            } else {

                                // Update failed count
                                summaryResult.failed += 1;

                                queueMessage.state = 'error';
                                queueMessage.error = _.pluck(syncResult.errors, 'message').join(';');
                                updateQueues.push(queueMessage);
                            }
                        });

                        // TODO: change to use sync manner

                        if (removeQueues.length > 0) {

                            // Remove messages from queue (allowed async)
                            navigator.smartstore.removeFromSoup(SMARTSTORE_COMMON_SETTING.SOUP_NAME_QUEUE, removeQueues, function (success) {
                                void 0;
                            }, function (err) {
                                // TODO: handle the exception
                            });
                        }

                        if (updateQueues.length > 0) {

                            // Update messages (allowed async)
                            navigator.smartstore.upsertSoupEntries(SMARTSTORE_COMMON_SETTING.SOUP_NAME_QUEUE, updateQueues, function (success) {
                                void 0;
                            }, function (error) {
                                // TODO: handle the exception
                            });
                        }

                        if (updateRecords.length > 0) {

                            // Update local records (allowed async)
                            navigator.smartstore.upsertSoupEntries(objectType, updateRecords, function (success) {
                                void 0;
                            }, function (err) {
                                // TODO: handle the exception
                            });
                        }

                        if (removeRecords.length > 0) {

                            // remove online deleted records
                            navigator.smartstore.removeFromSoup(objectType, removeRecords, function (success) {
                                void 0;
                            }, function (err) {
                                // TODO: handle the exception
                            });
                        }

                    } else {

                        // Update failed count
                        summaryResult.failed += records.length;

                        // Failed to sync, update error messages to Queue Messages
                        angular.forEach(queueMessages, function (queueMessage) {
                            queueMessage.state = 'error';
                            queueMessage.error = syncResults.message;
                        });

                        // TODO: change to use sync manner

                        // Update messages (allowed async)
                        navigator.smartstore.upsertSoupEntries(SMARTSTORE_COMMON_SETTING.SOUP_NAME_QUEUE, queueMessages, function (success) {
                            void 0;
                        }, function (error) {
                            // TODO: handle the exception
                        });
                    }

                    return summaryResult;
                };

                /**
                 * Adjust records for synchronization to salesforce:
                 * 1. Lookup SFDC reference according to _sid.
                 * 2. Remove can't writable fields.
                 *
                 * @param   {string} objectType the object type name.
                 * @param   {Array} records local smartStore data records of this object.
                 * @param   {string} operationType the operation type of the records.
                 * @returns {Promise}
                 */
                var adjustSyncUpRecords = function (objectType, records, operationType) {
                    var deferred = $q.defer();

                    // lookup SFDC reference according to _sid.
                    lookupSFDCReference(objectType, records, operationType).then(function (newRecords) {

                        // get writable fields of this object type
                        DescribeService.getSObjectWritableFields(objectType).then(function (writableFields) {

                            // include salesforce Id for business object records update and delete
                            if (operationType !== SMARTSTORE_COMMON_SETTING.QUEUE_MESSAGE_ACTION_INSERT) {
                                writableFields.push('Id');
                            }

                            var newObjs = [];

                            // iteration each record
                            angular.forEach(newRecords, function (obj) {
                                var newObj = {};

                                // iteration all fields of the record
                                angular.forEach(obj, function (value, fieldName) {

                                    // filter not writable fields
                                    if (writableFields.indexOf(fieldName) !== -1) {
                                        newObj[fieldName] = value;
                                    }
                                });

                                newObjs.push(newObj);
                            });

                            deferred.resolve(newObjs);
                        }, function (error) {
                            deferred.reject(error);
                        })

                    }, function (error) {
                        deferred.reject(error);
                    });

                    return deferred.promise;
                };

                /**
                 * Lookup SFDC reference according to _sid.
                 *
                 * @param   {string} objectType the object type name.
                 * @param   {Array} records local smartStore data records of this object.
                 * @returns {Promise}
                 */
                var lookupSFDCReference = function (objectType, records, operationType) {
                    var deferred = $q.defer();

                    if (operationType === SMARTSTORE_COMMON_SETTING.QUEUE_MESSAGE_ACTION_DELETE) {
                        deferred.resolve(records);
                    } else {
                        // get the describe of this business object
                        DescribeService.getDescribeSObject(objectType).then(function (describeResult) {

                            // get reference fields for lookup SFDC reference.
                            var promises = [];
                            angular.forEach(describeResult.fields, function (fieldItem) {

                                // filter reference fields
                                if (fieldItem.type === 'reference') {
                                    var fieldName = fieldItem.name;
                                    var referenceFieldName = fieldName + SMARTSTORE_COMMON_SETTING.REFERENCED_FIELD_EXTENSION_SUFFIX;
                                    var referenceFieldType = fieldName + SMARTSTORE_COMMON_SETTING.REFERENCED_FIELD_TYPE_SUFFIX;
                                    var sids = [];
                                    var types = [];

                                    // filter all _sid not null, push them into a distinct array.
                                    angular.forEach(records, function (record) {
                                        var sidValue = record[referenceFieldName];
                                        var typeValue = record[referenceFieldType];
                                        if (sidValue && sids.indexOf(sidValue) === -1 && !record[fieldName]) {
                                            sids.push(sidValue);
                                            types.push(typeValue);
                                        }
                                    });

                                    if (sids.length === 0) {
                                        return;
                                    }

                                    // query salesforce id map(key:sid value:sfId) of reference field according to _sid
                                    var promise = querySFIdAccordingToSid(sids, types, fieldItem['referenceTo']).then(function (sidSFId) {

                                        // update reference field value with salesforce id
                                        // which is related with special soup entry according to _sid
                                        angular.forEach(records, function (record) {
                                            var sidValue = record[referenceFieldName];

                                            if (sidValue && !record[fieldName]) {
                                                record[fieldName] = sidSFId[sidValue];
                                            }
                                        });
                                    }, function (error) {
                                        deferred.reject(error);
                                    });

                                    promises.push(promise);
                                }
                            });

                            $q.all(promises).then(function () {

                                // store these result into smartStore
                                LocalDataService.upsert(objectType, records, true).then(function () {
                                    deferred.resolve(records);
                                }, function (error) {
                                    deferred.reject(error);
                                });
                            }, function (error) {
                                deferred.reject(error);
                            });
                        }, function (err) {
                            deferred.reject(err);
                        });
                    }

                    return deferred.promise;
                };

                /**
                 * Query SFDC Id according to _sid in smartStore.
                 *
                 * @param   {Array} sids sid array.
                 * @param   {Array} types reference to object type array.
                 * @param   {Array} referenceTo objectType array of reference to.
                 * @returns {Promise}
                 */
                var querySFIdAccordingToSid = function (sids, types, referenceTo) {
                    var deferred = $q.defer();
                    var result = [];

                    if (!referenceTo || referenceTo.length === 0 || !sids || sids.length === 0) {
                        deferred.resolve(result);
                    } else {

                        // group sids by reference object types
                        var typeSids = {};
                        var referenceType;
                        for (var i = 0; i < sids.length; i++) {

                            // [field]_type should be filled by client code and it would take high priority, especially for referenceTo to multiple object types,
                            // because we don't know what type it is refering to like Attachment.ParentId
                            referenceType = types[i];

                            // if [field]_type is not filled, then use the first referenceTo by default
                            if (referenceType == null || referenceType == undefined) {
                                referenceType = referenceTo[0];
                            }

                            // initialize an array if the reference type is not added before
                            if (typeSids[referenceType] == null) {
                                typeSids[referenceType] = [];
                            }
                            typeSids[referenceType].push(sids[i]);
                        }

                        var doQuerySFIdAccordingToSid = function (referenceSoup, referenceSids) {

                            var deferred = $q.defer();

                            // check this reference is exist in local smartStore.
                            $injector.get('SmartStoreService').checkSoupExist(referenceSoup).then(function (exists) {
                                if (exists) {

                                    // building the query
                                    var smartSql = 'select {' + referenceSoup + ':_soupEntryId}, {' + referenceSoup + ':Id} from {' + referenceSoup + '} ';
                                    smartSql += 'where {' + referenceSoup + ':_soupEntryId} in (' + referenceSids.join(',') + ')';

                                    // building querySpec
                                    var querySpec = navigator.smartstore.buildSmartQuerySpec(smartSql, SMARTSTORE_COMMON_SETTING.PAGE_SIZE_FOR_ALL);

                                    // execute query reference object
                                    navigator.smartstore.runSmartQuery(false, querySpec, function (cursor) {

                                        var currentPageEntries = cursor.currentPageOrderedEntries;

                                        // iteration each gotten reference item
                                        angular.forEach(currentPageEntries, function (referenceItem) {
                                            result[referenceItem[0]] = referenceItem[1];
                                        });
                                        void 0;

                                        deferred.resolve(result);
                                    }, function (err) {
                                        deferred.reject(err);
                                    });
                                } else {
                                    deferred.resolve(result);
                                }
                            }, function (err) {
                                deferred.reject(err);
                            });

                            return deferred.promise;
                        };

                        var promises = [];

                        for (var referenceTypeAttr in typeSids) {
                            promises.push(doQuerySFIdAccordingToSid(referenceTypeAttr, typeSids[referenceTypeAttr]));
                        }

                        $q.all(promises).then(function () {
                            deferred.resolve(result);
                        }, function (err) {
                            deferred.reject(err);
                        });
                    }

                    return deferred.promise;
                };

                /**
                 * Prepare Mobile object types for synchronization between Salesforce and App while using mobile / remote for configuration
                 *
                 * @returns {Promise}
                 */
                service.prepareMobileConfigurationForSync = function () {

                    var deferred = $q.defer();

                    // Initialize object for sync wrapper
                    var objectSyncWrapper = initializeObjectSyncWrapper();

                    // Load mobile / remote configuration object definitions from local file (APP_SETTINGS.LOCAL_CONFIGURATION must be false)
                    ConfigurationService.mobileConfigurationToSynchronize().then(function (objectTypes) {
                        objectSyncWrapper.syncDownObjects.objectTypes = objectTypes;
                        objectSyncWrapper.syncDownObjects.syncProgress = service.initializeSyncDownProgress(objectTypes);

                        // Add a flag on objectSyncWrapper to ignore local reference
                        objectSyncWrapper.syncDownObjects.ignoreLocalReference = true;

                        deferred.resolve(objectSyncWrapper);
                    }, function (error) {
                        deferred.reject(error);
                    });

                    return deferred.promise;
                };

                /**
                 * initialize object sync wrapper.
                 *
                 * @returns {*}
                 */
                var initializeObjectSyncWrapper = function () {
                    return {
                        syncUpObjects: {
                            objectTypes: [],
                            syncProgress: {}
                        },
                        syncDownObjects: {
                            objectTypes: [],
                            syncProgress: {}
                        },
                        cleanUpObjects: {
                            objectTypes: [],
                            syncProgress: {}
                        }
                    };
                };

                /**
                 * Prepare object types for synchronization data between Salesforce and App
                 * This includes initialzing _meta and soups as well as returning objectSyncWrapper
                 *
                 * @returns {Promise}
                 */
                service.prepareBusinessObjectTypeForSync = function () {

                    var deferred = $q.defer();

                    // Initialize object for sync wrapper
                    var objectSyncWrapper = initializeObjectSyncWrapper();

                    // Load all business sobjects either from local or salesforce _object
                    ConfigurationService.objectTypesToSynchronize().then(function (objectTypes) {

                        // Initialize need to sync flags
                        for (var i = 0; i < objectTypes.length; i++) {
                            objectTypes[i].needSyncUp = true;
                            objectTypes[i].needSyncDown = true;
                        }

                        // initialize for sync up objects
                        objectSyncWrapper.syncUpObjects.objectTypes = objectTypes;
                        objectSyncWrapper.syncUpObjects.syncProgress = service.initializeSyncUpProgress(objectTypes);

                        // initialize for sync down objects
                        objectSyncWrapper.syncDownObjects.objectTypes = objectTypes;
                        objectSyncWrapper.syncDownObjects.syncProgress = service.initializeSyncDownProgress(objectTypes);

                        // initialize for clean up objects, clean up job should check all object types to clear up any dirty records.
                        objectSyncWrapper.cleanUpObjects.objectTypes = objectTypes;
                        objectSyncWrapper.cleanUpObjects.syncProgress = service.initializeCleanUpProgress(objectTypes);

                        deferred.resolve(objectSyncWrapper);
                    }, function (error) {
                        deferred.reject(error);
                    });

                    return deferred.promise;
                };

                /**
                 * @ngdoc method
                 * @name checkObjectTypesBeforeSynchronize
                 * @methodOf oinio.core.service:LocalSyncService
                 * @description
                 * Check which object types have changes online and therefore need to be synced.
                 * Meanwhile, the filter criteria for these object types would be synced as well.
                 *
                 * @param {array} objectTypes - Array with object types
                 *
                 * @returns {promise} the passed in object types with needSyncDown property overridden
                 */
                var checkObjectTypesBeforeSynchronize = function (objectTypes) {

                    var deferred = $q.defer();

                    // Build object type names and entry ids
                    var objectTypeNames = [], objectTypeSoupEntryIds = [];

                    for (var i = 0; i < objectTypes.length; i++) {
                        var objectType = objectTypes[i];
                        objectTypeNames.push(objectType.name);
                        objectTypeSoupEntryIds.push(objectType._soupEntryId);
                    }

                    // Check object records to sync down and update filter criteria
                    fetchCheckedObjectTypes(objectTypeNames).then(function (onlineObjectsInfo) {

                        if (onlineObjectsInfo) {

                            void 0;
                            var objects2upsert = [];

                            // Iterate each online object info to see if each need to sync down
                            for (var i = 0; i < objectTypes.length; i++) {
                                var objectType = objectTypes[i];
                                var objInfo = onlineObjectsInfo[objectType.name];

                                if (!objInfo || !objInfo.count || objInfo.count === 0) {

                                    // this object type has not changes online
                                    objectType.needSyncDown = false;
                                }

                                if (objInfo) {

                                    // the object filter criteria needs to be updated
                                    objects2upsert.push({
                                        '_soupEntryId': objectType._soupEntryId,
                                        'MobileVizArt__Filter_Criteria__c': objInfo.filterCriteria
                                    });
                                }
                            }

                            // There are some object type filter criteria changed, so update them
                            if (APP_SETTINGS.LOCAL_CONFIGURATION === false && objects2upsert.length > 0) {

                                // Get current local object type records
                                LocalDataService.getSObjects('_object', objectTypeSoupEntryIds).then(function (localObjects) {

                                    // Load current local object types and update the filter criteria
                                    for (var i = 0; i < objects2upsert.length; i++) {
                                        var localObj = _.findWhere(localObjects, {_soupEntryId: objects2upsert[i]._soupEntryId});
                                        localObj.MobileVizArt__Filter_Criteria__c = objects2upsert[i].MobileVizArt__Filter_Criteria__c;
                                        objects2upsert[i] = localObj;
                                    }

                                    // Update local object fitler criteria
                                    LocalDataService.upsert('_object', objects2upsert, true).then(function () {
                                        deferred.resolve(objectTypes);
                                    }, function (err) {
                                        deferred.reject(err);
                                    });
                                }, function (error) {
                                    deferred.reject(error);
                                });
                            } else {
                                deferred.resolve(objectTypes);
                            }
                        } else {
                            deferred.resolve(objectTypes);
                        }

                    }, function (err) {
                        deferred.reject(err);
                    });

                    return deferred.promise;
                };

                /**
                 * @ngdoc method
                 * @name fetchCheckedObjectTypes
                 * @methodOf oinio.core.service:LocalSyncService
                 * @description
                 * Call rest api for fetch checking result whether there are any updating with the special objects after the last sync down datetime,
                 * Meanwhile, when in online configuration model, return the latest modified filter criteria.
                 *
                 * @param {Array} objectTypeNames
                 *
                 * @returns {promise}
                 */
                var fetchCheckedObjectTypes = function (objectTypeNames) {
                    return $q(function (resolve, reject) {

                        var _lastSyncDownDate,
                            getObjectLastSyncDownDatePromiseArr = [],
                            hasNullLastSyncDownDate = false;

                        // Find earliest local last sync date - prepare promises
                        for (var i = 0; i < objectTypeNames.length; i++) {
                            var objName = objectTypeNames[i];
                            getObjectLastSyncDownDatePromiseArr.push(
                                MetaService.getObjectMetaByType(objName).then(function (meta) {
                                    if (meta && meta.lastSyncDownDate) {
                                        if (!_lastSyncDownDate || _lastSyncDownDate > meta.lastSyncDownDate) {
                                            _lastSyncDownDate = meta.lastSyncDownDate;
                                        }
                                    } else {
                                        // in case there is an object not sync down during the initialization, it should sync all again
                                        hasNullLastSyncDownDate = true;
                                    }
                                }, function (err) {
                                })
                            );
                        }

                        // Find earliest local last sync date - run promises
                        $q.all(getObjectLastSyncDownDatePromiseArr).then(function () {

                            // If no last sync down date found (the first time to sync down), no need to check online, all data should be synced in this case
                            if (hasNullLastSyncDownDate) {
                                resolve(null);
                                return;
                            }

                            // Find configuration id, first need to find current user and its profile id
                            var currentUser = LocalCacheService.get('currentUser');
                            if (currentUser) {

                                // get profile id
                                var profileId = currentUser['ProfileId'];

                                // load configuration from managed package (_configuration and _object)
                                LocalDataService.queryConfigurationAndObjects(profileId).then(function (configuration) {
                                    if (configuration) {

                                        var parseResp = function (response) {
                                            var result = {};
                                            if (response) {
                                                result.timeStamp = response.timeStamp;
                                                if (response['objectTypes']) {
                                                    for (var i = 0; i < response['objectTypes'].length; i++) {
                                                        var objInfo = response['objectTypes'][i];

                                                        // Only keep object types which are passed in to this function
                                                        if (objectTypeNames.indexOf(objInfo.objectType) > -1) {
                                                            result[objInfo.objectType] = objInfo;
                                                        }
                                                    }
                                                }
                                            }
                                            return result;
                                        };

                                        // Prepare rest request body
                                        var postBody = {
                                            clsRequest: {
                                                timeStamp: _lastSyncDownDate
                                            }
                                        };

                                        if (APP_SETTINGS.LOCAL_CONFIGURATION === true) {

                                            var objectConfig = [];
                                            if (configuration.objects) {

                                                for (var i = 0; i < configuration.objects.length; i++) {
                                                    var objItem = configuration.objects[i];
                                                    if (objectTypeNames.indexOf(objItem['Name']) !== -1
                                                        && skipSyncDownObjects.indexOf(objItem['Name']) === -1) {
                                                        objectConfig.push({
                                                            name: objItem['Name'],
                                                            filterCriteria: objItem['MobileVizArt__Filter_Criteria__c'],
                                                            lookupModStamp: objItem['MobileVizArt__Lookup_Mod_Stamp__c']
                                                        });
                                                    }
                                                }
                                            }

                                            postBody.clsRequest.objectConfig = objectConfig;

                                            void 0;
                                            RestService.checkObjectTypesToSynchronize(postBody).then(function (result) {
                                                void 0;
                                                resolve(parseResp(result));
                                            }, function (error) {

                                                // no apex class then resolve null, no connection or other errors then retry.
                                                if (error && error.rawException && error.rawException['responseJSON'] && error.rawException['responseJSON'][0]['errorCode'] === 'NOT_FOUND') {
                                                    $log.debug(error);

                                                    // if failed to get the information of checking, consider all objects as existing updating
                                                    resolve(null);
                                                } else {
                                                    reject(error);
                                                }
                                            });
                                        } else {
                                            postBody.clsRequest.confId = configuration.Id;

                                            void 0;
                                            RestService.checkObjectTypesToSynchronize(postBody).then(function (result) {
                                                void 0;
                                                resolve(parseResp(result));
                                            }, function (error) {
                                                reject(error);
                                            });
                                        }
                                    } else {
                                        reject('No configuration found.');
                                    }
                                }, reject);
                            } else {
                                reject('Failed to get basic information of the current login user.');
                            }

                        }, reject);
                    });
                };

                /**
                 * Initialzie sobjects' progress which need to be synced up to SFDC.
                 *
                 * @param   {array} objectTypes the object types for syncing up
                 * @returns {object} intialized sync up progress
                 */
                service.initializeSyncUpProgress = function (objectTypes) {

                    var syncUpProgress = {};

                    angular.forEach(objectTypes, function (objectType) {
                        var entry = {
                            name: objectType.name,
                            label: objectType.label,
                            status: {
                                inserted: 0,
                                insertFailed: 0,
                                insertTotal: 0,
                                updated: 0,
                                updateFailed: 0,
                                updateTotal: 0,
                                deleted: 0,
                                deleteFailed: 0,
                                deleteTotal: 0
                            }
                        };

                        syncUpProgress[objectType.name] = entry;
                    });

                    return syncUpProgress;
                };

                /**
                 * Initialize sobjects' progress which need to be synced down from SFDC.
                 *
                 * @param   {array} objectTypes the object types for syncing down
                 * @returns {object} intialized sync down progress
                 */
                service.initializeSyncDownProgress = function (objectTypes) {

                    var syncDownProgress = {};

                    angular.forEach(objectTypes, function (objectType) {
                        var entry = {
                            name: objectType.name,
                            label: objectType.label,
                            status: {
                                processed: 0,
                                total: 0
                            }
                        };

                        syncDownProgress[objectType.name] = entry;
                    });

                    return syncDownProgress;
                };

                /**
                 * Initialize all sobjects which need to be cleaned up to SFDC.
                 *
                 * @param   {array} objectTypes the object types for cleaning up
                 * @returns {object} intialized clean up progress
                 */
                service.initializeCleanUpProgress = function (objectTypes) {

                    var cleanUpProgress = {};

                    angular.forEach(objectTypes, function (objectType) {
                        var entry = {
                            name: objectType.name,
                            label: objectType.label,
                            status: {
                                deltaSharedProcessed: 0,
                                deltaSharedTotal: 0,
                                checkDirtyProcessed: 0,
                                checkDirtyTotal: 0,
                                newVisiableRecords: 0,
                                dirtyRecords: 0
                            }
                        };

                        cleanUpProgress[objectType.name] = entry;
                    });

                    return cleanUpProgress;
                };

                /**
                 * Sync up one specific object type.
                 *
                 * @param {String} objectName the object name for syncing up
                 * @returns {Promise}
                 */
                service.syncUpObjectByName = function (objectName) {

                    var deferred = $q.defer();

                    $log.debug('>>>> sync up a special object named ' + objectName + ' beginning.');

                    var handleError = function (error) {
                        if (error && typeof error.handle === 'function') {
                            error.retry = service.syncUpObjectByName;
                            error.retryContext = service;
                            error.retryParam = objectName;
                            error.retryDeferred = deferred;
                            error.handle();
                        } else {
                            new Exception(EXCEPTION_SEVERITY.RECOVERABLE, error.status, error.message, error.stack, error, service.syncUpObjectByName, null, service, objectName, deferred).handle();
                        }
                        deferred.reject(error);
                    };

                    // Initialize object for sync wrapper
                    var objectSyncWrapper = initializeObjectSyncWrapper();

                    // Load all business sobjects either from local or salesforce _object
                    ConfigurationService.objectTypesToSynchronize().then(function (objectTypes) {

                        var obj2SyncUp = [];

                        // Initialize need to sync flags
                        angular.forEach(objectTypes, function (objectType) {
                            if (objectType.name == objectName) {
                                obj2SyncUp.push(objectType);
                                objectType.needSyncUp = true;
                                objectType.needSyncDown = false;
                                objectType.needCleanUp = false;
                            }
                        });

                        // initialize for sync up objects
                        objectSyncWrapper.syncUpObjects.objectTypes = obj2SyncUp;
                        objectSyncWrapper.syncUpObjects.syncProgress = service.initializeSyncUpProgress(obj2SyncUp);

                        // initialize for sync down objects
                        objectSyncWrapper.syncDownObjects.objectTypes = [];
                        objectSyncWrapper.syncDownObjects.syncProgress = service.initializeSyncDownProgress([]);

                        // initialize for clean up objects, clean up job should check all object types to clear up any dirty records.
                        objectSyncWrapper.cleanUpObjects.objectTypes = [];
                        objectSyncWrapper.cleanUpObjects.syncProgress = service.initializeCleanUpProgress([]);

                        service.startSync(objectSyncWrapper).then(function (objectSyncResult) {
                            $log.debug('>>>> sync up a special object named ' + objectName + ' ended.');
                            deferred.resolve(objectSyncResult);
                        }, function (error) {
                            handleError(error);
                        }, function (process) {
                            deferred.notify(process);
                        });
                    }, function (error) {
                        handleError(error);
                    });

                    return deferred.promise;
                };

                /**
                 * Sync up all object types.
                 *
                 * @returns {Promise}
                 */
                service.syncUpObjectByAll = function () {

                    var deferred = $q.defer();

                    $log.debug('>>>> sync up all object beginning.');

                    var handleError = function (error) {
                        if (error && typeof error.handle === 'function') {
                            error.retry = service.syncUpObjectByAll;
                            error.retryDeferred = deferred;
                            error.handle();
                        } else {
                            new Exception(EXCEPTION_SEVERITY.RECOVERABLE, error.status, error.message, error.stack, error, service.syncUpObjectByAll, null, null, null, deferred).handle();
                        }
                        deferred.reject(error);
                    };

                    // Initialize object for sync wrapper
                    var objectSyncWrapper = initializeObjectSyncWrapper();

                    // Load all business sobjects either from local or salesforce _object
                    ConfigurationService.objectTypesToSynchronize().then(function (objectTypes) {

                        // Initialize need to sync flags
                        angular.forEach(objectTypes, function (objectType) {
                            objectType.needSyncUp = true;
                            objectType.needSyncDown = false;
                            objectType.needCleanUp = false;
                        });

                        // initialize for sync up objects
                        objectSyncWrapper.syncUpObjects.objectTypes = objectTypes;
                        objectSyncWrapper.syncUpObjects.syncProgress = service.initializeSyncUpProgress(objectTypes);

                        // initialize for sync down objects
                        objectSyncWrapper.syncDownObjects.objectTypes = [];
                        objectSyncWrapper.syncDownObjects.syncProgress = service.initializeSyncDownProgress([]);

                        // initialize for clean up objects, clean up job should check all object types to clear up any dirty records.
                        objectSyncWrapper.cleanUpObjects.objectTypes = [];
                        objectSyncWrapper.cleanUpObjects.syncProgress = service.initializeCleanUpProgress([]);

                        service.startSync(objectSyncWrapper).then(function (objectSyncResult) {
                            $log.debug('>>>> sync up all object ended.');
                            deferred.resolve(objectSyncResult);
                        }, function (error) {
                            handleError(error);
                        }, function (process) {
                            deferred.notify(process);
                        });
                    }, function (error) {
                        handleError(error);
                    });

                    return deferred.promise;
                };

        }
        );
})(angular, _);

(function (angular) {
    'use strict';

    /**
     * Module oinio.core LocalesService
     * LocalesService- methods to load the user's locale settings and fetching the various date,time,currency,number formats
     */
    angular.module('oinio.core')
        .service('LocalesService', function ($http, $log, $locale) {
            /**
             * locales information
             * @type {{datePattern:string,timePattern:string,dateTimePattern:string,currencyPattern:string,
             * decimalSeparator:string,thousandsSeparator:string,numberPattern:string,addressPattern:string}} localesInfo
             */
            var localesInfo = {};
            var defaultLocale = 'en_US';
            var defaultLocaleInfo = {};
            var currencySymbol = '$';
            var currencySymbolBefore = true;  //0 indicates currency symbol is to be placed before the value
            var defaultCurrencyISOCode = 'EUR';

            /**
             * gets all data for the users's locale from locales.json
             * @param {String} userLocale
             */
            this.loadLocaleData = function (userLocale) {
                $http.get('app/common/i18n/locales.json').success(function (response) {
                    for (var i = 0; i < response.locales.length; i++) {
                        var value = response.locales[i];
                        if (value.locale === defaultLocale) {
                            defaultLocaleInfo = value.pattern;
                        }
                        if (value.locale === userLocale) {
                            localesInfo = value.pattern;
                            $log.debug('Locales Info: ' + JSON.stringify(localesInfo));
                            break;
                        }
                    }
                    //if no matching locale object found for user's locale, then set the default locale to en_US
                    if (Object.keys(localesInfo).length === 0) {
                        localesInfo = defaultLocaleInfo;
                        $log.debug('Default Locales Info: ' + JSON.stringify(localesInfo));
                    }
                    //sets the currency symbol specified in the currencyPattern in locales.json
                    if (localesInfo.currencyPattern) {
                        var startOfCurrency = localesInfo.currencyPattern.indexOf('[');
                        var endOfCurrency = localesInfo.currencyPattern.indexOf(']');
                        currencySymbol = localesInfo.currencyPattern.slice(startOfCurrency + 1, endOfCurrency);
                        $locale.NUMBER_FORMATS.CURRENCY_SYM = currencySymbol;
                        currencySymbolBefore = (startOfCurrency === 0);
                    }
                    //sets the decimal separator, thousands separator
                    if (localesInfo.thousandsSeparator) {
                        $locale.NUMBER_FORMATS.GROUP_SEP = localesInfo.thousandsSeparator;
                    }
                    if (localesInfo.decimalSeparator) {
                        $locale.NUMBER_FORMATS.DECIMAL_SEP = localesInfo.decimalSeparator;
                    }

                }).error(function (error) {
                    $log.debug('Error loading the Locales Info' + error);
                });
            };

            /**
             * sets the value for currencyISOCode
             * @param {String} currencyCode
             */
            this.setCurrencyIsoCode = function (currencyCode) {
                defaultCurrencyISOCode = currencyCode;
            }

            /**
             * gets the value for currencyISOCode
             * @returns {String}
             */
            this.getCurrencyIsoCode = function () {
                return defaultCurrencyISOCode;
            }
            /**
             * returns the datePattern specified in the locales.json
             * @returns {String}
             */
            this.getDateFormat = function () {
                if (localesInfo.datePattern) {
                    void 0;
                    return localesInfo.datePattern;
                }
                return defaultLocaleInfo.datePattern;
            };

            /**
             * returns the timePattern specified in the locales.json
             * @returns {String}
             */
            this.getTimeFormat = function () {
                if (localesInfo.timePattern) {
                    return localesInfo.timePattern;
                }
                return defaultLocaleInfo.timePattern;
            };

            /**
             * returns the dateTimePattern specified in the locales.json
             * @returns {String}
             */
            this.getDateTimeFormat = function () {
                if (localesInfo.dateTimePattern) {
                    return localesInfo.dateTimePattern;
                }
                return defaultLocaleInfo.dateTimePattern;
            };

            /**
             * returns the currencyPattern specified in the locales.json
             * @returns {String}
             */
            this.getCurrencyFormat = function () {
                if (localesInfo.currencyPattern) {
                    return localesInfo.currencyPattern;
                }
                return defaultLocaleInfo.currencyPattern;
            };

            /**
             * returns the currency symbol specified in the locales.json
             * @returns {String}
             */
            this.getCurrencySymbol = function () {
                return currencySymbol;
            };

            /**
             * returns true if the placement of currency symbol is before the value as specified in the locales.json
             * @returns {Boolean}
             */
            this.getCurrencySymbolBefore = function () {
                return currencySymbolBefore;
            };

            /**
             * returns the decimal separator specified in the locales.json
             * @returns {String}
             */
            this.getDecimalSeparator = function () {
                if (localesInfo.decimalSeparator) {
                    return localesInfo.decimalSeparator;
                }
                return defaultLocaleInfo.decimalSeparator;
            };

            /**
             * returns the thousands separator specified in the locales.json
             * @returns {String}
             */
            this.getThousandsSeparator = function () {
                if (localesInfo.thousandsSeparator) {
                    return localesInfo.thousandsSeparator;
                }
                return defaultLocaleInfo.thousandsSeparator;
            };

            /**
             * returns the numberPattern specified in the locales.json
             * @returns {String}
             */
            this.getNumberFormat = function () {
                if (localesInfo.numberPattern) {
                    return localesInfo.numberPattern;
                }
                return defaultLocaleInfo.numberPattern;
            };

            /**
             * returns the number of decimal places specified in numberPattern the locales.json
             * @returns {Number}
             */
            this.getDecimalPlaces = function () {
                if (localesInfo.numberPattern) {
                    var decimalPlace = localesInfo.numberPattern.indexOf(this.getDecimalSeparator()) + 1; //+1 as index starts at 0
                    return localesInfo.numberPattern.length - decimalPlace;
                }
                return 3;
            };

            /**
             * returns the addressPattern specified in the locales.json
             * @returns {String}
             */
            this.getAddressFormat = function () {
                if (localesInfo.addressPattern) {
                    return localesInfo.addressPattern;
                }
                return defaultLocaleInfo.addressPattern;
            };
        });
})(angular);

(function (angular) {
    'use strict';

    /**
     * Module oinio.core MetaService
     */
    angular.module('oinio.core')
        .service('MetaService', function ($q, $filter, $log, $cordovaAppVersion, SMARTSTORE_COMMON_SETTING) {
            var service = this;
            var objectMetaSoup = '_objectMeta';
            var metaSoup = '_meta';

            /**
             * Initialising meta data for each configured objectType
             *
             * @param {Array} objectTypes names of the object types
             * @returns {Promise}
             */
            service.initializeMetaDataForObjectTypes = function (objectTypes) {
                void 0;

                var deferred = $q.defer();
                var entries = [];

                // query all meta data from _objectMeta in smartStore
                var querySpec = navigator.smartstore.buildAllQuerySpec('name', null, SMARTSTORE_COMMON_SETTING.PAGE_SIZE_FOR_ALL);
                navigator.smartstore.querySoup(objectMetaSoup, querySpec, function (cursor) {

                    var currentPageEntries = cursor.currentPageOrderedEntries;

                    // iteration each object type name
                    angular.forEach(objectTypes, function (objType) {

                        // search exist meta entry of the object type name
                        var existEntry = $filter('filter')(currentPageEntries, {name: objType}, true);

                        // if not exist meta entry of the name, create it.
                        if (existEntry === undefined || existEntry.length === 0) {
                            // TODO: error timestamp in case of initialization interrupts
                            var entry = {
                                name: objType,
                                lastSyncDownDate: null,
                                lastSyncUpDate: null,
                                lastCleanUpDate: null,
                                lastCleanUpDateForNewShare: null,
                                lastCheckDescribeDate: null
                            };

                            entries.push(entry);
                        }
                    });

                    if (entries.length > 0) {

                        // store new necessary created meta data
                        navigator.smartstore.upsertSoupEntries(false, objectMetaSoup, entries, function () {
                            deferred.resolve(true);
                        }, function (error) {
                            deferred.reject(error);
                        });
                    } else {
                        deferred.resolve(true);
                    }

                }, function (error) {
                    deferred.reject(error);
                });

                return deferred.promise;
            };

            /**
             * get _meta data by object type.
             *
             * @param {string} objectType name of object type
             * @returns {Promise}
             */
            service.getObjectMetaByType = function (objectType) {

                var deferred = $q.defer();

                // query the meta data of this object type name
                var querySpec = navigator.smartstore.buildExactQuerySpec('name', objectType, 1);

                navigator.smartstore.querySoup(false, objectMetaSoup, querySpec, function (cursor) {
                    var currentPageEntries = cursor.currentPageOrderedEntries;

                    var meta;

                    // if found return it, otherwise create a new meta instance
                    if (currentPageEntries && currentPageEntries.length > 0) {
                        meta = currentPageEntries[0];
                    } else {
                        meta = {
                            name: objectType,
                            lastSyncDownDate: null,
                            lastSyncUpDate: null,
                            lastCleanUpDate: null,
                            lastCleanUpDateForNewShare: null,
                            lastCheckDescribeDate: null
                        };
                    }

                    deferred.resolve(meta);
                }, function (error) {
                    deferred.reject(error);
                });
                return deferred.promise;
            };

            /**
             * update last sync down date of special object type _meta data.
             *
             * @param {string} objectType name of object type
             * @param {string} lastSyncDownDate last sync down date
             * @returns {Promise}
             */
            service.updateLastSyncDownDate = function (objectType, lastSyncDownDate) {

                var deferred = $q.defer();

                // get meta object by object type name
                service.getObjectMetaByType(objectType).then(function (meta) {

                    if (!meta) {
                        meta = {
                            name: objectType
                        };
                    }
                    meta.lastSyncDownDate = lastSyncDownDate;

                    // store meta into smartStore
                    updateMetaValue(objectMetaSoup, meta, 'name').then(function (upsertedMeta) {
                        deferred.resolve(upsertedMeta);
                    }, function (error) {
                        deferred.reject(error);
                    });

                }, function (error) {
                    deferred.reject(error);
                });

                return deferred.promise;
            };

            /**
             * update last sync up date of special object type _meta data.
             *
             * @param {string} objectType name of object type
             * @param {string} lastSyncUpDate last sync up date
             * @returns {Promise}
             */
            service.updateLastSyncUpDate = function (objectType, lastSyncUpDate) {

                var deferred = $q.defer();

                // get meta object by object type name
                service.getObjectMetaByType(objectType).then(function (meta) {

                    if (!meta) {
                        meta = {
                            name: objectType
                        };
                    }
                    meta.lastSyncUpDate = lastSyncUpDate;

                    // store meta into smartStore
                    updateMetaValue(objectMetaSoup, meta, 'name').then(function (upsertedMeta) {
                        deferred.resolve(upsertedMeta);
                    }, function (error) {
                        deferred.reject(error);
                    });

                }, function (error) {
                    deferred.reject(error);
                });

                return deferred.promise;
            };

            /**
             * update last clean up date for new share of special object type _meta data.
             *
             * @param {string} objectType name of object type
             * @param {string} lastCleanUpDateForNewShare last clean up date for new share
             * @returns {*|Promise}
             */
            service.updateLastCleanUpDateForNewShare = function (objectType, lastCleanUpDateForNewShare) {

                var deferred = $q.defer();

                // get meta object by object type name
                service.getObjectMetaByType(objectType).then(function (meta) {

                    if (!meta) {
                        meta = {
                            name: objectType
                        };
                    }
                    meta.lastCleanUpDateForNewShare = lastCleanUpDateForNewShare;

                    // store meta into smartStore
                    updateMetaValue(objectMetaSoup, meta, 'name').then(function (upsertedMeta) {
                        deferred.resolve(upsertedMeta);
                    }, function (error) {
                        deferred.reject(error);
                    });

                }, function (error) {
                    deferred.reject(error);
                });

                return deferred.promise;
            };

            /**
             * update last clean up date of special object type _meta data.
             *
             * @param {string} objectType name of object type
             * @param {string} lastCleanUpDate last clean up date
             * @returns {*|Promise}
             */
            service.updateLastCleanUpDate = function (objectType, lastCleanUpDate) {

                var deferred = $q.defer();

                // get meta object by object type name
                service.getObjectMetaByType(objectType).then(function (meta) {

                    if (!meta) {
                        meta = {
                            name: objectType
                        };
                    }
                    meta.lastCleanUpDate = lastCleanUpDate;

                    // store meta into smartStore
                    updateMetaValue(objectMetaSoup, meta, 'name').then(function (upsertedMeta) {
                        deferred.resolve(upsertedMeta);
                    }, function (error) {
                        deferred.reject(error);
                    });

                }, function (error) {
                    deferred.reject(error);
                });

                return deferred.promise;
            };

            /**
             * update last check describe date of special object type _meta data.
             *
             * @param {string} objectType name of object type
             * @param {string} lastCheckDescribeDate last check describe date
             * @returns {Promise}
             */
            service.updateLastCheckDescribeDate = function (objectType, lastCheckDescribeDate) {

                var deferred = $q.defer();

                // get meta object by object type name
                service.getObjectMetaByType(objectType).then(function (meta) {

                    if (!meta) {
                        meta = {
                            name: objectType
                        };
                    }
                    meta.lastCheckDescribeDate = lastCheckDescribeDate;

                    // store meta into smartStore
                    updateMetaValue(objectMetaSoup, meta, 'name').then(function (upsertedMeta) {
                        deferred.resolve(upsertedMeta);
                    }, function (error) {
                        deferred.reject(error);
                    });

                }, function (error) {
                    deferred.reject(error);
                });

                return deferred.promise;
            };

            /**
             * upsert meta data.
             * @param {string} soup
             * @param {object} meta
             * @returns {Promise}
             */
            var updateMetaValue = function (soup, meta, key) {

                var deferred = $q.defer();

                // store meta into smartStore
                navigator.smartstore.upsertSoupEntriesWithExternalId(false, soup, [meta], key, function (result) {
                    deferred.resolve(result);
                }, function (error) {
                    deferred.reject(error);
                });

                return deferred.promise;
            };

            /**
             * set value in _meta soup
             * @param {string} key
             * @param {object} value
             */
            service.setMetaValue = function (key, value) {
                var deferred = $q.defer();

                var meta = {
                    key: key,
                    value: value
                };

                $log.debug('>>>> set meta value for key: ' + key + ' meta:' + JSON.stringify(meta));
                updateMetaValue(metaSoup, meta, 'key').then(function (result) {
                    deferred.resolve(result);
                }, function (error) {
                    deferred.reject(error);
                });

                return deferred.promise;
            };

            /**
             * get meta value by key
             * @param {string} key
             * @returns {*}
             */
            service.getMetaValue = function (key) {

                var deferred = $q.defer();

                // query the meta data for key
                var querySpec = navigator.smartstore.buildExactQuerySpec('key', key, 1);

                navigator.smartstore.querySoup(false, metaSoup, querySpec, function (cursor) {
                    var currentPageEntries = cursor.currentPageOrderedEntries;

                    var metaValue = null;

                    // if found return it, otherwise create a new meta instance
                    if (currentPageEntries && currentPageEntries.length > 0) {
                        metaValue = currentPageEntries[0].value;
                    }

                    deferred.resolve(metaValue);
                }, function (error) {
                    deferred.reject(error);
                });
                return deferred.promise;

            };

            /**
             * Enhance to get meta value by key
             * @param {string} key
             * @returns {*}
             */
            service.getMetaValueEnhance = function (key) {

                var deferred = $q.defer();

                // check if _meta soup is already initialized
                navigator.smartstore.soupExists(false, metaSoup, function (exists) {
                        if (exists) {
                            service.getMetaValue(key).then(function (metaValue) {
                                deferred.resolve(metaValue);
                            }, function (error) {
                                deferred.reject(error);
                            });
                        }
                        else {
                            deferred.resolve();
                        }
                    }, function (error) {
                        deferred.reject(error);
                    }
                );

                return deferred.promise;
            };

            /**
             * checks if application is already initialized
             * @returns {Promise}
             */
            service.appInitialized = function () {
                var deferred = $q.defer();

                service.getMetaValue('initialized').then(function (initialized) {
                    deferred.resolve(initialized !== null);
                }, function (error) {
                    deferred.reject(error);
                });

                return deferred.promise;
            };

            /**
             * set app initialized flag, including initializing the last cleanup datetime.
             */
            service.setAppInitialized = function () {
                service.setMetaValue('initialized', true);

                service.getMetaValue('lastCleanUpDate').then(function (lastCleanUpDate) {
                    if (!lastCleanUpDate) {
                        service.setMetaValue('lastCleanUpDate', new Date());
                    }
                }, function (error) {
                    $log.debug(error);
                });
            };

            /**
             * checks if setting up soups is already done
             * @returns {*}
             */
            service.soupInitialized = function () {
                var deferred = $q.defer();

                // check if _meta soup is already initialized
                navigator.smartstore.soupExists(false, metaSoup, function (exists) {
                        if (exists) {
                            // if all soups are completely initialized, setupsoup flag is true
                            service.getMetaValue('setupsoup').then(function (setupsoup) {
                                deferred.resolve(setupsoup !== null);
                            }, function (error) {
                                deferred.reject(error);
                            });
                        }
                        else {
                            deferred.resolve(false);
                        }
                    }, function (error) {
                        error.method = 'meta.service::soupInitialized->soupExists';
                        $log.debug(error);
                        deferred.reject(error);
                    }
                );

                return deferred.promise;
            };

            /**
             * set soup initialized flag
             */
            service.setSoupInitialized = function () {
                service.setMetaValue('setupsoup', true);
            };

            /**
             * set the app version in _meta.
             */
            service.setAppVersion = function () {
                $cordovaAppVersion.getVersionNumber().then(function (appVersion) {
                    service.setMetaValue('appVersion', appVersion);
                }, function (error) {
                    $log.debug(error);
                });
            };
        });
})(angular);

(function (angular) {
    'use strict';

    /**
     * Module oinio.core picklistService
     */
    angular.module('oinio.core')
        .service('PicklistService', function ($q) {
            var service = this;
            var picklistsSoup = '_picklists';

            /**
             * load all picklist data from the describe layout of all related sobjects.
             *
             * @param {Array} describeLayoutResults
             * @returns {Promise}
             */
            service.loadAllPicklists = function (describeLayoutResults) {
                var deferred = $q.defer();
                var promises = [];

                // iteration describe layout of every sobject
                angular.forEach(describeLayoutResults, function (describeLayoutResult) {
                    promises.push(service.loadPicklists(describeLayoutResult));
                });

                $q.all(promises).then(function () {
                    deferred.resolve(true);
                }, function () {
                    deferred.reject(false);
                });

                return deferred.promise;
            };

            /**
             * load all picklist fields data of one sobject from its describe layout
             *
             * @param {object} describeLayoutResult
             * @returns {Promise}
             */
            service.loadPicklists = function (describeLayoutResult) {
                var deferred = $q.defer();

                // iteration every layout of different record type
                angular.forEach(describeLayoutResult.describeLayouts, function (describeLayout) {

                    // get all picklist fields
                    var picklistFields = getPicklistFields(describeLayout.layoutResult);
                    var picklistEntries = [];

                    // iteration every picklist field
                    var getRecordTypeDeveloperNamePromises = [];
                    angular.forEach(picklistFields, function (fieldDetails) {

                        // generate the unique external key of smartstore table
                        getRecordTypeDeveloperNamePromises.push($q(function (resolve, reject) {

                            var querySpec = navigator.smartstore.buildExactQuerySpec('Id', describeLayout.recordTypeId, 1);
                            navigator.smartstore.querySoup('RecordType', querySpec, function (cursor) {
                                var result = (cursor && cursor.currentPageOrderedEntries && cursor.currentPageOrderedEntries.length) ? cursor.currentPageOrderedEntries[0] : null;

                                var uniqueExternalKey = service.getUniqueExternalKey(describeLayoutResult.objectType, describeLayout.recordTypeId, fieldDetails.name),
                                    uniqueExternalDeveloperNameKey = null;
                                if (result) {
                                    uniqueExternalDeveloperNameKey = service.getUniqueExternalKey(describeLayoutResult.objectType, result.DeveloperName, fieldDetails.name);
                                }
                                var picklistEntry = {
                                    'objectName': describeLayoutResult.objectType,
                                    'fieldName': fieldDetails.name,
                                    'recordTypeId': describeLayout.recordTypeId,
                                    'dependentPicklist': fieldDetails.dependentPicklist,
                                    'controllerName': fieldDetails.controllerName,
                                    'uniqueExternalKey': uniqueExternalKey,
                                    'picklistValues': []
                                };

                                if (uniqueExternalDeveloperNameKey) {
                                    picklistEntry['uniqueExternalDeveloperNameKey'] = uniqueExternalDeveloperNameKey;
                                }

                                angular.forEach(fieldDetails['picklistValues'], function (picklistValue) {
                                    var picklistValueEntry = {
                                        'masterValue': picklistValue.value,
                                        'active': picklistValue.active,
                                        'defaultValue': picklistValue.defaultValue,
                                        'label': picklistValue.label,
                                        'validFor': picklistValue.validFor
                                    };

                                    picklistEntry.picklistValues.push(picklistValueEntry);
                                });

                                picklistEntries.push(picklistEntry);

                                resolve(true);
                            }, reject);
                        }));
                    });

                    // store these picklist fields data according to different record type
                    $q.all(getRecordTypeDeveloperNamePromises).then(function () {
                        navigator.smartstore.upsertSoupEntriesWithExternalId(false, picklistsSoup, picklistEntries, 'uniqueExternalKey', function () {
                            deferred.resolve(true);
                        }, function (error) {
                            deferred.reject(error);
                        });
                    }, function (err) {
                        deferred.reject(err);
                    });
                });

                return deferred.promise;
            };

            /**
             * get all picklist fields information from the sobject describe layout of special record type
             *
             * @param {object} layoutResult
             * @returns {Array}
             */
            function getPicklistFields(layoutResult) {
                var picklistFields = [];

                angular.forEach(layoutResult['detailLayoutSections'], function (editLayoutSection) {

                    if (editLayoutSection) {
                        angular.forEach(editLayoutSection['layoutRows'], function (layoutRow) {

                            if (layoutRow) {
                                angular.forEach(layoutRow['layoutItems'], function (layoutItem) {

                                    if (layoutItem) {
                                        angular.forEach(layoutItem['layoutComponents'], function (layoutComponent) {

                                            if (layoutComponent && layoutComponent['details']) {

                                                var fieldDetails = layoutComponent['details'];

                                                if (fieldDetails.type === 'picklist' || fieldDetails.type === 'multipicklist') {
                                                    picklistFields.push(fieldDetails);
                                                }
                                            }
                                        });
                                    }
                                });
                            }
                        });
                    }
                });

                return picklistFields;
            }

            /**
             * get picklist entry of the fieldName of special record type object.
             *
             * @param {string} objectName object name
             * @param {string} fieldName field name
             * @param {string} recordType record type id or record type name
             * @param {boolean} [recordTypeIsName] if undefined or true then recordType parameter is signed id, if true signed name.
             * @returns {promise}
             */
            service.getPicklistEntry = function (objectName, fieldName, recordType, recordTypeIsName) {
                var deferred = $q.defer();

                var querySpec;
                var queryUniqueKey = service.getUniqueExternalKey(objectName, recordType, fieldName);
                if (!recordTypeIsName) {
                    querySpec = navigator.smartstore.buildExactQuerySpec('uniqueExternalKey', queryUniqueKey, 1);
                } else {
                    querySpec = navigator.smartstore.buildExactQuerySpec('uniqueExternalDeveloperNameKey', queryUniqueKey, 1);
                }

                navigator.smartstore.querySoup(false, picklistsSoup, querySpec, function (cursor) {
                    var result = (cursor && cursor.currentPageOrderedEntries && cursor.currentPageOrderedEntries.length) ? cursor.currentPageOrderedEntries[0] : null;

                    if (result) {
                        deferred.resolve(result);
                    } else {
                        deferred.resolve({});
                    }
                }, function (error) {
                    deferred.reject(error);
                });

                return deferred.promise;
            };

            /**
             * contact some special fields into one unique external key of local table _picklists.
             *
             * @param {string} objectName
             * @param {string} recordTypeId
             * @param {string} fieldName
             *
             * @returns {string}
             */
            service.getUniqueExternalKey = function (objectName, recordTypeId, fieldName) {
                var separator = '|';
                return objectName + separator + recordTypeId + separator + fieldName;
            };
        });
})(angular);

(function (angular) {
    'use strict';

    /**
     * Module oinio.core RecordTypeService
     */
    angular.module('oinio.core')
        .service('RecordTypeService', function ($q, $filter, $log, SMARTSTORE_COMMON_SETTING, SalesforceDataService) {
            var service = this;
            var recordTypeSoup = 'RecordType';
            var MasterRecordTypeId = '012000000000000AAA';

            /**
             * synchronization all record types according to record type ids.
             *
             * @param {Array} recordTypeIds
             * @returns {Promise}
             */
            service.syncDownAllRecordType = function (recordTypeIds) {
                var deferred = $q.defer();

                var soql = 'SELECT Id, toLabel(Name), DeveloperName, SobjectType FROM RecordType WHERE IsActive = true ' +
                    'AND Id IN (' + contactArrayToString(recordTypeIds) + ')';

                // query the data from salesforce
                SalesforceDataService.queryAll(soql).then(function (result) {

                    // store these data into smartstore
                    storeRecordTypeData(result).then(function () {
                        deferred.resolve(true);
                    }, function (error) {
                        deferred.reject(error);
                    });
                }, function (error) {
                    deferred.reject(error);
                });

                return deferred.promise;
            };

            /**
             * store record types which are got from salesforce,
             * and remove unnecessary record types which is deleted or invisible for current user.
             *
             * @param {object} recordTypeData
             * @returns {Promise}
             */
            function storeRecordTypeData(recordTypeData) {
                var deferred = $q.defer();
                var existRecordTypeIds = [];

                // fill exist record types id
                angular.forEach(recordTypeData, function (rtItem) {
                    existRecordTypeIds.push(rtItem.Id);
                });

                // fill Master record type id
                existRecordTypeIds.push(MasterRecordTypeId);

                // query unnecessary record types in smartstore
                var smartSql = 'select * from {' + recordTypeSoup + '} where {' + recordTypeSoup + ':Id' +
                    '} not in (' + contactArrayToString(existRecordTypeIds) + ')';

                var querySpec = navigator.smartstore.buildSmartQuerySpec(smartSql, SMARTSTORE_COMMON_SETTING.PAGE_SIZE_FOR_ALL);

                navigator.smartstore.runSmartQuery(false, querySpec, function (cursor) {

                    var currentPageEntries = cursor.currentPageOrderedEntries;

                    // remove unnecessary record types
                    navigator.smartstore.removeFromSoup(false, recordTypeSoup, currentPageEntries, function () {

                        // insert or update necessary record types which are got from salesforce
                        // by external key 'Id' of record type id in salesforce.
                        navigator.smartstore.upsertSoupEntriesWithExternalId(false, recordTypeSoup, recordTypeData, 'Id', function () {
                            deferred.resolve(true);
                        }, function (error) {
                            deferred.reject(error);
                        });

                    }, function (error) {
                        deferred.reject(error);
                    });

                }, function (error) {
                    deferred.reject(error);
                });

                return deferred.promise;
            }

            /**
             * store dummy Master record types for related sobject types
             *
             * @param {Array} sobjectTypes
             * @returns {Promise}
             */
            service.storeDummyRecordType = function (sobjectTypes) {
                var deferred = $q.defer();
                var recordTypeData = [];

                // query all dummy Master record types which already exist in smartstore
                var smartSql = 'select * from {' + recordTypeSoup + '} where {' + recordTypeSoup + ':Id' + '} = \'' + MasterRecordTypeId + '\'';
                var querySpec = navigator.smartstore.buildSmartQuerySpec(smartSql, SMARTSTORE_COMMON_SETTING.PAGE_SIZE_FOR_ALL);
                navigator.smartstore.runSmartQuery(false, querySpec, function (cursor) {

                    var currentPageEntries = cursor.currentPageOrderedEntries;

                    // iteration each sobject type name
                    angular.forEach(sobjectTypes, function (sobjectType) {

                        // search exist dummy Master record type entry of the sobject type name in smartstore
                        var existEntry = $filter('filter')(currentPageEntries, {SobjectType: sobjectType}, true);

                        // if not exist dummy Master record type entry of the sobject type name, create it.
                        if (existEntry === undefined || existEntry.length === 0) {
                            var recordType = {
                                'DeveloperName': 'Master',
                                'Name': 'Master',
                                'SobjectType': sobjectType,
                                'Id': MasterRecordTypeId
                            };

                            recordTypeData.push(recordType);
                        }
                    });

                    if (recordTypeData.length > 0) {

                        // store new necessary created dummy Master record types data
                        navigator.smartstore.upsertSoupEntries(false, recordTypeSoup, recordTypeData, function () {
                            deferred.resolve(true);
                        }, function (error) {
                            deferred.reject(error);
                        });
                    } else {
                        deferred.resolve(true);
                    }

                }, function (error) {
                    deferred.reject(error);
                });

                return deferred.promise;
            };

            /**
             * contact array into string with comma
             *
             * @param {Array} arr
             * @returns {string}
             */
            function contactArrayToString(arr) {
                var str = '';
                angular.forEach(arr, function (item) {
                    if (str !== '') {
                        str += ',';
                    }

                    str += '\'' + item + '\'';
                });

                if (str === '') {
                    str = '\'\'';
                }

                return str;
            }

        });
})(angular);

(function() {
    'use strict';

    /**
     * @ngdoc service
     * @name oinio.core.service:RelatedListService
     * @description Access related lists
     */
    angular
        .module('oinio.core')
        .service('RelatedListService', RelatedListService);

        RelatedListService.$inject = ['$q', '$injector'];

    /**
     * Related list service
     *
     * @param $q
     * @param $injector
     * @returns {getAllRelatedListsByObjectType, getPageableRelatedRecordsForRelatedList}
     * @constructor
     */

    function RelatedListService($q, $injector) {

        return {
            getAllRelatedListsByObjectType: getAllRelatedListsByObjectType,
            getPageableRelatedRecordsForRelatedList: getPageableRelatedRecordsForRelatedList
        };

        /**
         * Get all related lists for the specified object type
         *
         * @param objectType
         * @returns Array Related lists for objectType or undefined
         */
        function getAllRelatedListsByObjectType (objectType) {
            if(!objectType || angular.isUndefined(objectType)) {
                throw new Error('Missing argument exception. "objectType" needs to be specified.')
            }

            var deferred = $q.defer();
            var result = [];
            var layoutableConfiguredObjectTypes = [];
            var describeService = $injector.get('DescribeService');
            var configurationService = $injector.get('ConfigurationService');

            configurationService.getConfiguredObjectTypes(true).then(function (objectTypes) {
                layoutableConfiguredObjectTypes = objectTypes;
                return describeService.getDescribeLayout(objectType);
            }).then(function (describeLayout) {
                return _getLayoutableRelatedLists(describeLayout.layoutResult.relatedLists, layoutableConfiguredObjectTypes);
            }).then(function (filteredRelatedLists) {
                deferred.resolve(filteredRelatedLists);
            }).catch(function (error) {
                deferred.reject(error);
            });

            return deferred.promise;
        }

        /**
         * Returns the array of relatedLists which are layoutable
         *
         * @param relatedLists
         * @param layoutableObjectTypes
         * @private
         */
        function _getLayoutableRelatedLists(relatedLists, layoutableObjectTypes) {
            var result = [];
            var deferred = $q.defer();

            for(var i = 0; i < relatedLists.length; i++) {
                // Return without adding the relatedList if its type is not a layoutable object
                if(layoutableObjectTypes.indexOf(relatedLists[i].sobject) == -1) {
                    continue;
                }
                // Push the whole related list object to the result set
                result.push(relatedLists[i]);
            }

            deferred.resolve(result);

            return deferred.promise;
        }

        /**
         * Get a pageable set of related records for a related list and return <pageSize> starting from
         * page <currentPage>. If no records were found, the <relatedRecords> attribute of the result object
         * will be undefined. The arguments <pageSize> and <currentPage> are optional arguments. They
         * can be skipped. In this case 10 will be used as default for <pageSize> and 1 will be used
         * as default for <currentPage>. Both arguments will also be part of the result object.
         *
         * @param relatedList
         * @param parentObjectSid
         * @param objectType
         * @param pageSize
         * @param currentPage
         * @returns {{relatedRecords: undefined, pageSize: (*|number), recordsTotalCount: (*|number), currentPage: (*|number), pageTotalCount: (*|number)}}
         */
        function getPageableRelatedRecordsForRelatedList (relatedList, parentObjectSid, objectType, pageSize, currentPage) {

            if(!parentObjectSid || angular.isUndefined(parentObjectSid)) {
                throw new Error('Missing argument exception. "parentObjectSid" needs to be specified.')
            }

            if(!relatedList || angular.isUndefined(relatedList)) {
                throw new Error('Missing argument exception. "relatedList" needs to be specified.')
            }

            var deferred = $q.defer();
            var result = {
                entries: undefined,
                pageSize: pageSize || 10,
                currentPage: currentPage || 1,
                totalEntries: 0,
                totalPages: 0,
                rawCursor: undefined
            };

            var smartSql = 'select {' + relatedList.sobject + ':_soup} from {' + relatedList.sobject + '} where {' + relatedList.sobject + ':' + objectType + 'Id_sid} = ' + parentObjectSid;
            var smartQuery = navigator.smartstore.buildSmartQuerySpec(smartSql);

            _getCursorForSmartQuery(smartQuery).then(function (cursor) {
                result.rawCursor = cursor;
                result.totalPages = cursor.totalPages;
                result.totalEntries = cursor.totalEntries;
                return _getAllowedColumnsFromRelatedList(relatedList);
            }).then(function (allowedColumns) {
                return _getThinnedEntryObjectsFromCursorEntries(result.rawCursor.currentPageOrderedEntries, allowedColumns);
            }).then(function (thinnedEntries) {
                result.entries = thinnedEntries;
                deferred.resolve(result);
            }).catch(function (error) {
                deferred.reject(error);
            });

            return deferred.promise;
        }

        /**
         * Return thinned entry from big raw entries based on allowed column names
         * TODO: Needs refactoring
         * @param rawEntries
         * @param allowedColumns
         * @returns {*|promise}
         * @private
         */
        function _getThinnedEntryObjectsFromCursorEntries(rawEntries, allowedColumns) {
            var deferred = $q.defer();
            var result = [];

            for(var i = 0; i < rawEntries.length; i++) {
                var entry = rawEntries[i][0];
                var thinnedEntry = {
                    _soupEntryId: entry._soupEntryId
                };

                for(var j = 0; j < allowedColumns.length; j++) {
                    if (!entry[allowedColumns[j].name] || angular.isUndefined(entry[allowedColumns[j].name])) {
                        continue;
                    }

                    thinnedEntry[allowedColumns[j].name] = entry[allowedColumns[j].name];
                }

                if(thinnedEntry !== {}) {
                    result.push(thinnedEntry);
                }
            }

            deferred.resolve(result);
            return deferred.promise;
        }

        /**
         * Return the full cursor that will be returned as response for the query.
         * @param smartQuery
         * @returns {*|promise}
         * @private
         */
        function _getCursorForSmartQuery(smartQuery) {
            if(!smartQuery || angular.isUndefined(smartQuery)) {
                throw new Error('Missing argument exception. "smartQuery" needs to be specified.')
            }

            var deferred = $q.defer();
            var result = [];

            navigator.smartstore.runSmartQuery(smartQuery, function (cursor) {
                if (cursor.currentPageOrderedEntries && cursor.currentPageOrderedEntries.length == 0) {
                    deferred.reject(new Error('No records found.'));
                    return;
                }

                deferred.resolve(cursor);
            }, function (error) {
                deferred.reject(error);
            });

            return deferred.promise;
        }

        /**
         * Returns true if the column is not allowed
         *
         * @param column
         * @param localAvailableField
         * @returns {boolean}
         * @private
         */
        function _isNotAllowedColumn(column, localAvailableField) {
            return (_isNotAllowedColumnName(column) || _isLookupColumn(column) || column.name !== localAvailableField.name) && localAvailableField.name !== 'Name' && localAvailableField.name !== 'Subject';
        }

        /**
         * returns true if the specified local field is allowed
         * @param relatedList
         * @param localAvailableField
         * @private
         */
        function _isAllowedLocalField(relatedList, localAvailableField) {
            var result = false;

            for(var i = 0; i < relatedList.columns.length; i++) {
                if (result || _isNotAllowedColumn(relatedList.columns[i], localAvailableField)) {
                    continue;
                }

                result = true;
            }

            return result;
        }

        /**
         * Get the allowed columns for the specified related list
         * TODO: Really needs refactoring. Ugly. Shame on me.
         * @param relatedList
         * @returns {*|promise}
         * @private
         */
        function _getAllowedColumnsFromRelatedList(relatedList) {
            if(!relatedList || angular.isUndefined(relatedList)) {
                throw new Error('Missing argument exception. "relatedList" needs to be specified.')
            }

            if(!relatedList.columns || angular.isUndefined(relatedList.columns)) {
                throw new Error('Missing argument exception. "relatedList.columns" needs to be specified.')
            }

            var deferred = $q.defer();
            var result = [];
            var localDataService = $injector.get('LocalDataService');

            localDataService.getFieldInformations(relatedList.sobject).then(function (localAvailableFields) {
                for(var i = 0; i < localAvailableFields.length; i++) {
                    if(!_isAllowedLocalField(relatedList, localAvailableFields[i])) {
                        continue;
                    }

                    result.push(localAvailableFields[i]);
                }
                deferred.resolve(result);
            }).catch(function (error) {
                deferred.reject(error);
            });

            return deferred.promise;
        }

        /**
         * Return true, if the column name is considered as "not allowed"
         *
         * @param column
         * @returns {boolean}
         * @private
         */
        function _isNotAllowedColumnName(column) {
            var notAllowedColumnNamePatterns = [
                'toLabel',
                'ToReport'
            ];

            return notAllowedColumnNamePatterns.indexOf(column.name) !== -1
        }

        /**
         * Returns true of column is a lookup column
         * @param column
         * @returns {boolean}
         * @private
         */
        function _isLookupColumn(column) {
            return column.lookupId !== null;
        }
    }

})();
(function (angular) {
    'use strict';

    /**
     * @ngdoc service
     * @name oinio.core.service:RestService
     *
     * @description
     * TODO: description
     */
    angular.module('oinio.core')
        .service('RestService', function ($q, $log, ForceClientService, LocalCacheService, LocalDataService, MetaService, APP_SETTINGS, $injector) {
            var service = this;

            var Exception = $injector.get('Exception');
            var EXCEPTION_SEVERITY = $injector.get('EXCEPTION_SEVERITY');
            var PROCESS_CODE = $injector.get('PROCESS_CODE');
            var STATUS_CODE = $injector.get('STATUS_CODE');

            var getCheckObjectTypesToSynchronizeUrl = function () {
                if (APP_SETTINGS.LOCAL_CONFIGURATION === true) {
                    return '/MobileVizArt/checkObjectTypesToSynchronize'; // url without namesapece
                } else {
                    return '/MobileVizArt/MobileVizArt/checkObjectTypesToSynchronize'; // url with namesapece
                }
            };

            var getGetServerTimestampUrl = function () {
                if (APP_SETTINGS.LOCAL_CONFIGURATION === true) {
                    return '/MobileVizArt/utils'; // url without namesapece
                } else {
                    return '/MobileVizArt/MobileVizArt/utils'; // url with namesapece
                }
            };

            // local configuration would never call this url, so it always pointing to the package url
            var getGetFilterCriteriaUrl = function () {
                return '/MobileVizArt/MobileVizArt/getFilterCriteria';
            };

            var getGetObjectPermissionsUrl = function () {
                if (APP_SETTINGS.LOCAL_CONFIGURATION === true) {
                    return '/MobileVizArt/getObjectPermissions'; // url without namesapece
                } else {
                    return '/MobileVizArt/MobileVizArt/getObjectPermissions'; // url with namesapece
                }
            };

            var getSyncRecordsToSfdcUrl = function () {
                if (APP_SETTINGS.LOCAL_CONFIGURATION === true) {
                    return '/MobileVizArt/syncRecordsToSfdc'; // url without namesapece
                } else {
                    return '/MobileVizArt/MobileVizArt/syncRecordsToSfdc'; // url with namesapece
                }
            };

            var getSyncDownSharedRecordsUrl = function () {
                if (APP_SETTINGS.LOCAL_CONFIGURATION === true) {
                    return '/MobileVizArt/syncDownSharedRecords'; // url without namesapece
                } else {
                    return '/MobileVizArt/MobileVizArt/syncDownSharedRecords'; // url with namesapece
                }
            };

            var getCheckTotalRecordsUrl = function () {
                if (APP_SETTINGS.LOCAL_CONFIGURATION === true) {
                    return '/MobileVizArt/checkTotalRecords'; // url without namesapece
                } else {
                    return '/MobileVizArt/MobileVizArt/checkTotalRecords'; // url with namesapece
                }
            };

            var getCheckRecordsExistenceUrl = function () {
                if (APP_SETTINGS.LOCAL_CONFIGURATION === true) {
                    return '/MobileVizArt/checkRecordsExistence'; // url without namesapece
                } else {
                    return '/MobileVizArt/MobileVizArt/checkRecordsExistence'; // url with namesapece
                }
            };

            var getGetRecordIdsUrl = function () {
                if (APP_SETTINGS.LOCAL_CONFIGURATION === true) {
                    return '/MobileVizArt/getRecordIds'; // url without namesapece
                } else {
                    return '/MobileVizArt/MobileVizArt/getRecordIds'; // url with namesapece
                }
            };

            var getGetRecordsByIdsUrl = function () {
                if (APP_SETTINGS.LOCAL_CONFIGURATION === true) {
                    return '/MobileVizArt/getRecordsByIdsEnhanced'; // url without namesapece
                } else {
                    return '/MobileVizArt/MobileVizArt/getRecordsByIdsEnhanced'; // url with namesapece
                }
            };

            var getGetUserInfoUrl = function () {
                if (APP_SETTINGS.LOCAL_CONFIGURATION === true) {
                    return '/MobileVizArt/getUserInfo'; // url without namesapece
                } else {
                    return '/MobileVizArt/MobileVizArt/getUserInfo'; // url with namesapece
                }
            };

            /**
             * @ngdoc method
             * @name checkObjectTypesToSynchronize
             * @methodOf oinio.core.service:RestService
             * @description
             * Check whether there are updating in object types after a special timestamp.
             *
             * @param {object} payload - parameter
             * String timeStamp;
             * String lookupModStamp;
             * Array objectConfig;
             * e.g:
             * {
             *   "clsRequest": {
             *     "timeStamp": "2017-04-13T03:44:22.747Z",
             *     "confId": null,
             *     "objectConfig": [{
             *       "name": "Account",
             *       "lookupModStamp": null,
             *       "filterCriteria": "Name != null"
             *     }]
             *   }
             * }
             *
             * @returns {promise} - count 1: existing updating records; count 0: no existing.
             * e.g:
             *  {
             *  "timeStamp":"2017-04-13T03:51:35.888Z",
             *  "objectTypes":[{
             *      "parent":null,
             *      "objectType":"Account",
             *      "filterCriteria":"Name != null",
             *      "error":null,
             *      "count":1
             *    }]
             *  }
             */
            service.checkObjectTypesToSynchronize = function (payload) {
                var deferred = $q.defer();

                // call custom REST class in Mobile VizARt package
                ForceClientService.getForceClient().apexrest(getCheckObjectTypesToSynchronizeUrl(), 'POST', JSON.stringify(payload), null, function (response) {
                    $log.debug('>>>> RestService checkObjectTypesToSynchronize() success');
                    deferred.resolve(response);
                }, function (error) {
                    var msg = error['responseJSON'] && error['responseJSON'][0]['message'] ? error['responseJSON'][0]['message'] : null;
                    deferred.reject(new Exception(EXCEPTION_SEVERITY.RECOVERABLE, error.status, msg, error.stack, error));
                });

                return deferred.promise;
            };

            /**
             * @ngdoc method
             * @name getServerTimestamp
             * @methodOf oinio.core.service:RestService
             * @description
             * Get server time from Salesforce by REST class /MobileVizArt/MobileVizArt/utils
             *
             * @returns {string} current Salesforce server time in Salesforce DateTime format
             */
            service.getServerTimestamp = function () {
                var deferred = $q.defer();

                // call custom REST class in Mobile VizArt package
                ForceClientService.getForceClient().apexrest(getGetServerTimestampUrl(), 'GET', {}, null, function (response) {
                    $log.debug('Get server time >>>>>>>>> ' + JSON.stringify(response));
                    if (response) {
                        response = response.replace('+0000', 'Z');
                    }
                    void 0;
                    deferred.resolve(response);
                }, function (error) {
                    var msg = error['responseJSON'] && error['responseJSON'][0]['message'] ? error['responseJSON'][0]['message'] : null;
                    deferred.reject(new Exception(EXCEPTION_SEVERITY.RECOVERABLE, error.status, msg, error.stack, error));
                });

                return deferred.promise;
            };

            /**
             * @ngdoc method
             * @name getFilterCriteria
             * @methodOf oinio.core.service:RestService
             * @description
             * Get full parsed filter criteria from Salesfroce custom REST class /MobileVizArt/MobileVizArt/getFilterCriteria
             *
             * @returns {object} filter criteria for all configured objects {filterCriterias: [{objName: "objectName", filterCriteria: "filterCriteria"}, {}]}
             */
            service.getFilterCriteria = function () {
                var deferred = $q.defer();

                if (APP_SETTINGS.LOCAL_CONFIGURATION === true) {
                    LocalDataService.queryConfigurationAndObjects().then(function (configuration) {
                        var result = {
                            filterCriterias: []
                        };

                        if (configuration && configuration.objects) {
                            angular.forEach(configuration.objects, function (configObj) {
                                result.filterCriterias.push({
                                    objName: configObj.Name,
                                    filterCriteria: configObj['MobileVizArt__Filter_Criteria__c']
                                });
                            });
                        }

                        void 0;
                        deferred.resolve(result);
                    }, function (error) {
                        error.method = 'rest.service::getFilterCriteria->queryConfigurationAndObjects';
                        $log.debug(error);
                        deferred.reject(error);
                    });
                } else {
                    // call custom REST class in Mobile VizArt package
                    ForceClientService.getForceClient().apexrest(getGetFilterCriteriaUrl(), 'POST', '{}', null, function (response) {
                        $log.debug('>>>> RestService getFilterCriteria() success');
                        void 0;
                        deferred.resolve(response);
                    }, function (error) {
                        var msg = error['responseJSON'] && error['responseJSON'][0]['message'] ? error['responseJSON'][0]['message'] : null;
                        deferred.reject(new Exception(EXCEPTION_SEVERITY.RECOVERABLE, error.status, msg, error.stack, error));
                    });
                }

                return deferred.promise;
            };

            /**
             * @ngdoc method
             * @name getObjectPermission
             * @methodOf oinio.core.service:RestService
             * @description
             * Get user object permissions for all configured object types
             *
             * @param {object} payload
             * @param {string} payload.userId - Salesforce user Id of current User
             * @param {string} payload.profileId - Salesforce profile Id of current users profile
             * @param {array} payload.objectNames - Array with object API names
             *
             * @returns {promise} users object permissions for all configured objects
             * {list_ObjectPermission: [{PermissionCreate: boolean, PermissionDelete: boolean, PermissionEdit: boolean, PermissionModifyAllRecords: boolean,
             * PermissionRead: boolean, PermissionViewAllRecords: boolean, SobjectType: objectType}]}
             */
            service.getObjectPermissions = function (payload) {
                var deferred = $q.defer();

                // call custom REST class in Mobile VizARt package
                ForceClientService.getForceClient().apexrest(getGetObjectPermissionsUrl(), 'POST', JSON.stringify(payload), null, function (response) {
                    $log.debug('>>>> RestService getObjectPermissions() success');
                    void 0;
                    deferred.resolve(response);
                }, function (error) {
                    var msg = error['responseJSON'] && error['responseJSON'][0]['message'] ? error['responseJSON'][0]['message'] : null;
                    deferred.reject(new Exception(EXCEPTION_SEVERITY.RECOVERABLE, error.status, msg, error.stack, error));
                });

                return deferred.promise;
            };

            /**
             * @ngdoc method
             * @name syncRecordsToSfdc
             * @methodOf oinio.core.service:RestService
             * @description
             * Synchronization up local data to salesforce
             *
             * @param {Array} payload - Records which are synchronization up to salesforce.
             *
             * @returns {promise} synchronization results of all records as below:
             * {success: Boolean, message: String, records: List<Sobject>,
             * upsertResults: [ {id: ID, isCreated: Boolean, isSuccess: Boolean, errors: [{fields:List<String>, message: String}]} ],
             * deleteResults: [ {id: ID, isSuccess: Boolean, errors: [{fields:List<String>, message: String}]} ]
             * }
             */
            service.syncRecordsToSfdc = function (payload) {
                var deferred = $q.defer();

                // call custom REST class in Mobile VizARt package
                ForceClientService.getForceClient().apexrest(getSyncRecordsToSfdcUrl(), 'POST', JSON.stringify(payload), null, function (response) {
                    $log.debug('>>>> RestService syncRecordsToSfdc() success');
                    deferred.resolve(response);
                }, function (error) {
                    var msg = error['responseJSON'] && error['responseJSON'][0]['message'] ? error['responseJSON'][0]['message'] : null;
                    deferred.reject(new Exception(EXCEPTION_SEVERITY.RECOVERABLE, error.status, msg, error.stack, error));
                });

                return deferred.promise;
            };

            /**
             * @ngdoc method
             * @name syncDownSharedRecords
             * @methodOf oinio.core.service:RestService
             * @description
             * Sync down delta shared records.
             *
             * @param {object} payload - parameter
             * DateTime lastSyncTimeStamp - should be the same one using in the sync down process in the same sync process, it is queried on sharing table;
             * DateTime serverTimeStamp - should be the same one using in sync down process in the same sync process, it is queried on sharing table;
             * String soql - it contains the selected fields and filter criteria, but not includes lastModTimeStamp fields, it is queried on object;
             * String objectType - the object type;
             * Integer pageSize - limit on sharing table, so the actual returned records might less than the page size;
             * String lastId - the last share id, so that server would only query records where id is great than it, it is queried on sharing table;
             * e.g:
             * {
             *     "serverTimeStamp": "2016-07-12T10:01:51.000Z",
             *     "soql": "select Id, Name from Account where name != null",
             *     "sobjectType": "Account",
             *     "pageSize": 5
             * }
             * 
             * @returns {promise} an array of records and page size if it queries on the first page
             * List<SObject> records;
             * Integer totalSize (only return when lastId is null - first call);
             * String lastId - the last share id;
             * e.g:
             * {
             *     "totalSize": 47,
             *     "succeed": true,
             *     "records": [
             *         {
             *             "attributes": {
             *                 "type": "Account",
             *                 "url": "/services/data/v33.0/sobjects/Account/0014E000002MkOzQAK"
             *             },
             *             "Id": "0014E000002MkOzQAK",
             *             "Name": "Account Test 01"
             *         }
             *     ],
             *     "message": "",
             *     lastId: "xxxxxxxxxxxxxxx",
             * }
             */
            service.syncDownSharedRecords = function (payload) {
                var deferred = $q.defer();

                // call custom REST class in Mobile VizARt package
                ForceClientService.getForceClient().apexrest(getSyncDownSharedRecordsUrl(), 'POST', JSON.stringify(payload), null, function (response) {
                    $log.debug('>>>> RestService syncDownSharedRecords() success');
                    deferred.resolve(response);
                }, function (error) {
                    var msg = error['responseJSON'] && error['responseJSON'][0]['message'] ? error['responseJSON'][0]['message'] : null;
                    deferred.reject(new Exception(EXCEPTION_SEVERITY.RECOVERABLE, error.status, msg, error.stack, error));
                });

                return deferred.promise;
            };

            /**
             * @ngdoc method
             * @name checkTotalRecords
             * @methodOf oinio.core.service:RestService
             * @description
             * Check total amount of the records of the objects before a specific time.
             *
             * @param {object} payload - parameter
             * DateTime serverTimeStamp - should be the same one using in sync down process in the same sync process, it is queried on sharing table;
             * Map<String, String> map_objectType_soql - the soql contains sum, filter criteria and lastModTimeStamp fields except the great than part, only less than serverTimeStamp)
             * e.g:
             * {
             *     "serverTimeStamp": "2016-07-12T10:01:51.000Z",
             *     "map_objectType_soql": {
             *         "Account": "select count(Id) total from account Where name != null"
             *     }
             * }
             * 
             * @returns {promise} Map<String, Integer> map_objectType_total - total amount of each object
             * e.g:
             * {
             *     "succeed": true,
             *     "message": "",
             *     "map_objectType_total": {
             *         "Account": 36
             *     }
             * }
             */
            service.checkTotalRecords = function (payload) {
                var deferred = $q.defer();

                // call custom REST class in Mobile VizARt package
                ForceClientService.getForceClient().apexrest(getCheckTotalRecordsUrl(), 'POST', JSON.stringify(payload), null, function (response) {
                    $log.debug('>>>> RestService checkTotalRecords() success');
                    deferred.resolve(response);
                }, function (error) {
                    var msg = error['responseJSON'] && error['responseJSON'][0]['message'] ? error['responseJSON'][0]['message'] : null;
                    deferred.reject(new Exception(EXCEPTION_SEVERITY.RECOVERABLE, error.status, msg, error.stack, error));
                });

                return deferred.promise;
            };

            /**
             * @ngdoc method
             * @name checkRecordsExistence
             * @methodOf oinio.core.service:RestService
             * @description
             * Check if records are existing in SFDC any more.
             *
             * @param {object} payload - parameter
             * String objectType;
             * array recordIds;
             * e.g:
             * {
             *     "recordIds": ["0014E000008elpTQAQ", "0014E00000BurQsQAJ"],
             *     "objectType": "Account"
             * }
             *
             * @returns {promise} array recordIds (not existing in Org anymore and need to be deleted in the app)
             * e.g:
             * {
             *     "succeed": true,
             *     "recordIds": ["0014E00000BurQsQAJ"],
             *     "message": ""
             * }
             */
            service.checkRecordsExistence = function (payload) {
                var deferred = $q.defer();

                // call custom REST class in Mobile VizARt package
                ForceClientService.getForceClient().apexrest(getCheckRecordsExistenceUrl(), 'POST', JSON.stringify(payload), null, function (response) {
                    $log.debug('>>>> RestService checkRecordsExistence() success');
                    deferred.resolve(response);
                }, function (error) {
                    var msg = error['responseJSON'] && error['responseJSON'][0]['message'] ? error['responseJSON'][0]['message'] : null;
                    deferred.reject(new Exception(EXCEPTION_SEVERITY.RECOVERABLE, error.status, msg, error.stack, error));
                });

                return deferred.promise;
            };

            /**
             * @ngdoc method
             * @name getRecordIds
             * @methodOf oinio.core.service:RestService
             * @description
             * Get record ids are existing in SFDC.
             *
             * @param {object} payload - parameter
             * String soql - it contains the selected Id and filter criteria, but not includes lastModTimeStamp fields, it is queried on object;
             * String objectType - the object type;
             * Integer pageSize - returned records size;
             * String lastId - the last query id, so that server would only query records where id is great than it, in the first time it is null;
             * e.g:
             * {
             *     "soql": "select Id from Account where name != null",
             *     "objectType": "Account",
             *     "pageSize": 5
             * }
             *
             * @returns {promise} array list_ids (existing in SFDC)
             * e.g:
             * {
             *     "succeed": true,
             *     "list_ids": ["0014E00000BurQsQAJ"],
             *     "total": 1,
             *     "message": ""
             * }
             */
            service.getRecordIds = function (payload) {
                var deferred = $q.defer();

                // call custom REST class in Mobile VizARt package
                ForceClientService.getForceClient().apexrest(getGetRecordIdsUrl(), 'POST', JSON.stringify(payload), null, function (response) {
                    $log.debug('>>>> RestService getRecordIds() success');
                    deferred.resolve(response);
                }, function (error) {
                    var msg = error['responseJSON'] && error['responseJSON'][0]['message'] ? error['responseJSON'][0]['message'] : null;
                    deferred.reject(new Exception(EXCEPTION_SEVERITY.RECOVERABLE, error.status, msg, error.stack, error));
                });

                return deferred.promise;
            };

            /**
             * @ngdoc method
             * @name getRecordsByIds
             * @methodOf oinio.core.service:RestService
             * @description
             * Get records in salesforce by their ids.
             *
             * @param {object} payload - parameter
             * String soql - it contains the selected fields and filter criteria, but not includes lastModTimeStamp fields, it is queried on object;
             * array ids record salesforce ids;
             * e.g:
             * {
             *     "soql": "select Id, Name ... from Account where name != null"
             *     "ids": "0014E00000BurQsQAJ,0014E00000BurSmQAJ"
             * }
             *
             * @returns {promise} array records
             * e.g:
             * {
             *     "succeed": true,
             *     "records": [{"Id": "0014E00000BurQsQAJ", "Name":"Test acc"}, ...],
             *     "message": ""
             * }
             */
            service.getRecordsByIds = function (payload) {
                var deferred = $q.defer();

                // call custom REST class in Mobile VizARt package
                ForceClientService.getForceClient().apexrest(getGetRecordsByIdsUrl(), 'POST', JSON.stringify(payload), null, function (response) {
                    $log.debug('>>>> RestService getRecordsByIds() success');
                    deferred.resolve(response);
                }, function (error) {
                    var msg = error['responseJSON'] && error['responseJSON'][0]['message'] ? error['responseJSON'][0]['message'] : null;
                    deferred.reject(new Exception(EXCEPTION_SEVERITY.RECOVERABLE, error.status, msg, error.stack, error));
                });

                return deferred.promise;
            };

            /**
             * @ngdoc method
             * @name getUserInfo
             * @methodOf oinio.core.service:RestService
             * @description
             * Get user info in salesforce.
             *
             * @returns {promise}
             * e.g:
             * {
             *     "networkId": null,
             *     "currentUser": {"Id": "00558000001OS0XAAW", "Name":"Test user", ...}
             * }
             */
            service.getUserInfo = function () {
                var deferred = $q.defer();

                // call custom REST class in Mobile VizARt package
                ForceClientService.getForceClient().apexrest(getGetUserInfoUrl(), 'GET', null, null, function (response) {
                    // do not log here becasue we do not have user informations at this stage
                    // and this causes problems in the error log implementation
                    // $log.debug('>>>> RestService getUserInfo() success');
                    deferred.resolve(response);
                }, function (error) {
                    var msg = error['responseJSON'] && error['responseJSON'][0]['message'] ? error['responseJSON'][0]['message'] : null;
                    deferred.reject(new Exception(EXCEPTION_SEVERITY.RECOVERABLE, error.status, msg, error.stack, error));
                });

                return deferred.promise;
            };
        });

})(angular);

(function (angular) {
    'use strict';

    /**
     * Module oinio.core SalesforceDataService
     */
    angular.module('oinio.core')
        .service('SalesforceDataService', function ($q, $log, ForceClientService, UtilService, MetaService, LocalDataService, RestService, Exception, EXCEPTION_SEVERITY) {
            var service = this;

            /**
             * Load user info from salesforce, inlucding profile id, etc.
             *
             * @returns {Promise}
             */
            service.loadUserInfo = function () {

                var deferred = $q.defer();

                var handleError = function (error) {
                    if (error && typeof error.handle === 'function') {
                        error.retry = service.loadUserInfo;
                        error.retryDeferred = deferred;
                        error.handle();
                    } else {
                        new Exception(EXCEPTION_SEVERITY.RECOVERABLE, error.status, error.message, error.stack, error, service.loadUserInfo, null, null, null, deferred).handle();
                    }
                    deferred.reject(error);
                };

                UtilService.isDeviceOnline().then(function (online) {
                    if (online === true) {

                        // query user info from salesforce
                        RestService.getUserInfo().then(function (userInfo) {
                            deferred.resolve(userInfo);
                        }, function (error) {
                            error.method = 'salesforce-data.service::loadUserInfo->forceClient1';
                            $log.debug(error);

                            MetaService.getMetaValueEnhance('userInfo').then(function (userInfo) {
                                if (userInfo) {
                                    deferred.resolve(userInfo);
                                }
                                else {
                                    handleError({
                                        message: 'Failed to load user info from salesforce and local, please ensure that you are connected to the internet.' +
                                        ' If the problem persists, please contact your administrator.'
                                    });
                                }
                            }, function (error) {
                                handleError(error);
                            });
                        });
                    }
                    else {
                        MetaService.getMetaValueEnhance('userInfo').then(function (userInfo) {
                            if (userInfo) {
                                deferred.resolve(userInfo);
                            } else {
                                handleError({
                                    message: 'Failed to load user info from local, please connect to the internet and try again.' +
                                    ' If the problem persists, please contact your administrator.'
                                });
                            }
                        }, function (error) {
                            handleError(error);
                        });
                    }
                }, function (error) {
                    handleError(error);
                });

                return deferred.promise;
            };

            /**
             * query records based on the given soql statement
             * @param {string} soql
             * @returns {*}
             */
            service.query = function (soql) {
                var deferred = $q.defer();
                var forceClient = ForceClientService.getForceClient();

                void 0;
                forceClient.query(soql, function (result) {
                    var data = {
                        'done': result.done,
                        'nextRecordsUrl': result.nextRecordsUrl,
                        'totalSize': result.totalSize,
                        'records': result.records
                    };
                    deferred.resolve(data);
                }, function (error) {
                    void 0;
                    $log.warn(new Exception(null, error.status, error.message, error.stack, error));
                    deferred.reject('Failed to Load Data.');
                });

                return deferred.promise;
            };

            /**
             * query records based on the given soql statement
             * @param {string} nextRecordsUrl
             * @returns {*}
             */
            service.queryMore = function (nextRecordsUrl) {
                var deferred = $q.defer();
                var forceClient = ForceClientService.getForceClient();

                void 0;

                forceClient.queryMore(nextRecordsUrl, function (result) {
                    var data = {
                        'done': result.done,
                        'nextRecordsUrl': result.nextRecordsUrl,
                        'totalSize': result.totalSize,
                        'records': result.records
                    };
                    deferred.resolve(data);
                }, function (error) {
                    void 0;
                    $log.warn(new Exception(null, error.status, error.message, error.stack, error));
                    deferred.reject('Failed to Load Data.');
                });

                return deferred.promise;
            };

            /**
             * queryAll records bases on the given soql statement
             * @param {string} soql
             * @param {boolean} [withDeleted]
             * @returns {*}
             */
            service.queryAll = function (soql, withDeleted) {
                var deferred = $q.defer();
                var forceClient = ForceClientService.getForceClient();
                var data = [];

                void 0;

                var _queryData = function (param) {
                    deferred = param.deferred || $q.defer();

                    if (!param.nextRecordsUrl) {
                        if (!withDeleted) {
                            forceClient.query(param.soql, function (result) {

                                data = data.concat(result.records);

                                if (result.done === false) {
                                    _queryData({
                                        nextRecordsUrl: result.nextRecordsUrl,
                                        soql: param.soql,
                                        deferred: deferred
                                    });
                                } else {
                                    deferred.resolve(data);
                                }
                            }, function (error) {
                                void 0;
                                $log.warn(new Exception(null, error.status, error.message, error.stack, error));
                                deferred.reject('Failed to Load Data.');
                            });
                        } else {
                            forceClient.queryAll(param.soql, function (result) {

                                data = data.concat(result.records);

                                if (result.done === false) {
                                    _queryData({
                                        nextRecordsUrl: result.nextRecordsUrl,
                                        soql: param.soql,
                                        deferred: deferred
                                    });
                                } else {
                                    deferred.resolve(data);
                                }
                            }, function (error) {
                                void 0;
                                $log.warn(new Exception(null, error.status, error.message, error.stack, error));
                                deferred.reject('Failed to Load Data.');
                            });
                        }
                    } else {
                        forceClient.queryMore(param.nextRecordsUrl, function (result) {

                            data = data.concat(result.records);

                            if (result.done === false) {
                                _queryData({
                                    nextRecordsUrl: result.nextRecordsUrl,
                                    soql: param.soql,
                                    deferred: deferred
                                });
                            } else {
                                deferred.resolve(data);
                            }
                        }, function (error) {
                            void 0;
                            $log.warn(new Exception(null, error.status, error.message, error.stack, error));
                            deferred.reject('Failed to Load Data.');
                        });
                    }
                    return deferred.promise;
                };

                _queryData({
                    soql: soql
                }).then(function (data) {
                    deferred.resolve(data);
                }, function (err) {
                    deferred.reject(err);
                });

                return deferred.promise;
            };

            /**
             * create new record in Salesforce
             * @param {string} parentId Salesforce Id of parent object
             * @param {string} title Title of Note
             * @param {string} body Body of Note
             * @param {*} additionalFields
             */
            service.createNote = function (parentId, title, body, additionalFields) {
                var deferred = $q.defer();

                // TODO: additional fields
                var noteFields = {ParentId: parentId, Title: title, Body: body};

                var forceClient = ForceClientService.getForceClient();
                forceClient.create('Note', noteFields, function (success) {
                    void 0;
                    deferred.resolve(success);
                }, function (error) {
                    void 0;
                    $log.warn(new Exception(null, error.status, error.message, error.stack, error));
                    deferred.reject(error);
                });

                return deferred.promise;
            };

            /**
             * get Notes for Parent Object
             * @param {string} parentId Salesforce Id of parent object
             * @param {string} condition WHERE clause for SOQL statement without WHERE
             * @param {string} order ORDER BY for SOQL statement without ORDER BY
             */
            service.getNotesForParent = function (parentId, condition, order) {
                var deferred = $q.defer();

                var objectType = 'Note';

                LocalDataService.soqlFieldsForObjectType(objectType).then(function (fields) {

                    var soql = 'SELECT ' + fields.toString() + ' FROM ' + objectType + ' WHERE ParentId=\'' + parentId + '\'';

                    if (condition !== undefined && condition !== '') {
                        soql = soql + ' WHERE ' + condition;
                    }

                    if (order !== undefined && order !== '') {
                        soql = soql + ' ORDER BY ' + order;
                    }

                    var forceClient = ForceClientService.getForceClient();

                    forceClient.query(soql, function (result) {
                        void 0;

                        var notes = [];

                        angular.forEach(result.records, function (entry) {
                            var note = {};

                            angular.forEach(fields, function (field) {
                                if (entry.hasOwnProperty(field)) {
                                    note[field] = entry[field];
                                }
                            });

                            notes.push(note);
                        });

                        deferred.resolve(notes);
                    }, function (error) {
                        void 0;
                        $log.warn(new Exception(null, error.status, error.message, error.stack, error));
                        deferred.reject('Failed to Load Data.');
                    });
                }, function (error) {
                    deferred.reject(error);
                });

                return deferred.promise;
            };

            /**
             * create Attachment
             * @param {string} parentId Salesforce Id for parent object
             * @param {string} name name of Attachemnt. Name musst include the file extension e.g. .jpg
             * @param {string} description description for the Attachment
             * @param {*} body image data of the Attachment
             * @param {*} contentType content type the Attachment
             * @returns {*}
             */
            service.createAttachment = function (parentId, name, description, body, contentType) {
                var deferred = $q.defer();

                var attachmentFields = {
                    ParentId: parentId,
                    Name: name,
                    Description: description,
                    Body: body,
                    ContentType: contentType
                };

                var forceClient = ForceClientService.getForceClient();
                forceClient.create('Attachment', attachmentFields, function (success) {
                    void 0;
                    deferred.resolve(success);
                }, function (error) {
                    void 0;
                    $log.warn(new Exception(null, error.status, error.message, error.stack, error));
                    deferred.reject(error);
                });

                return deferred.promise;
            };

            /**
             * Create ContentVersion, including creating or updating ContentDocument and ContentDocumentLink records(ShareType='I')
             *
             * @param {string} contentDocumentId ContentDocument Id for target file object,
             *              if is null, will create a new ContentDocument record; otherwise update the related ContentDocument record.
             * @param {string} versionData file data base64 string of this version
             * @param {string} pathOnClient file name in local
             * @param {string} title file name for display in salesforce
             * @param {string} description file description
             * @param {string} networkId current user networkId(community id)
             *
             * @returns {*}
             */
            service.createContentVersion = function (contentDocumentId, versionData, pathOnClient, title, description, networkId) {
                var deferred = $q.defer();

                // workaround for android smartstore null issue
                var isAndroid = UtilService.isAndroidOS();

                if(isAndroid && contentDocumentId === 'null'){
                    contentDocumentId = null;
                }

                var contentVersionFields = {
                    ContentDocumentId: contentDocumentId,
                    VersionData: versionData,
                    PathOnClient: pathOnClient,
                    Title: title,
                    Description: description
                };

                // if user does not belong to a community or community is not available, networkId does not exists
                if(networkId){
                    contentVersionFields.NetworkId =  networkId;
                }

                var forceClient = ForceClientService.getForceClient();
                forceClient.create('ContentVersion', contentVersionFields, function (success) {
                    void 0;
                    deferred.resolve(success);
                }, function (error) {
                    void 0;
                    $log.warn(new Exception(null, error.status, error.message, error.stack, error));
                    deferred.reject(error);
                });

                return deferred.promise;
            };

            /**
             * Fetch file id(ContentDocument id) from salesforce by its contentVersion id.
             *
             * @param {string} contentVersionId contentVersionId (its ContentDocumentId for target file object)
             *
             * @returns {*|promise}
             */
            service.fetchFileIdByContentVersionId = function (contentVersionId) {
                var deferred = $q.defer();

                if (contentVersionId) {
                    var soql = 'select ContentDocumentId from ContentVersion where Id = \'' + contentVersionId + '\' limit 1';

                    service.query(soql).then(function (result) {

                        if (result.records && result.records.length === 1) {
                            deferred.resolve(result.records[0].ContentDocumentId);
                        } else {
                            deferred.reject('Fetch file id error: not found ContentVersion whose id is ' + contentVersionId);
                        }
                    }, function (error) {
                        deferred.reject('Fetch file id error: ' + JSON.stringify(error));
                    });
                } else {
                    deferred.reject('Fetch file id error: contentVersionId is null.');
                }

                return deferred.promise;
            };

            /**
             * Adds a file share member for the specified fileId to the specified entityId
             *
             * @param {string} fileId file's Id(ContentDocument Id for target file object)
             * @param {string} entityId Id of the entity to share the file to (e.g. a user or a group)
             * @param {string} shareType the type of share (V - View, C - Collaboration)
             *
             * @returns {*}
             */
            service.addFileShareMember = function (fileId, entityId, shareType) {
                var deferred = $q.defer();

                var forceClient = ForceClientService.getForceClient();
                forceClient.addFileShare(fileId, entityId, shareType, function (success) {
                    void 0;
                    deferred.resolve(success);
                }, function (error) {
                    void 0;
                    $log.warn(new Exception(null, error.status, error.message, error.stack, error));
                    var msg = error['responseJSON'] && error['responseJSON'][0]['message'] ? error['responseJSON'][0]['message'] : null;
                    deferred.reject(new Exception(EXCEPTION_SEVERITY.RECOVERABLE, error.status, msg, error.stack, error));
                });

                return deferred.promise;
            };

            /**
             * Adds a file share member for the specified collaborationGroup.
             *
             * @param {string} fileId file's Id(ContentDocument Id for target file object)
             * @param {string} shareType the type of share (V - View, C - Collaboration)
             * @param {string} collaborationGroupName collaborationGroup name
             *
             * @returns {*|promise}
             */
            service.addFileShareMemberByGroupName = function (fileId, shareType, collaborationGroupName) {
                var deferred = $q.defer();

                var soql = 'select Id from CollaborationGroup where Name = \'' + collaborationGroupName + '\' limit 1';

                service.query(soql)
                    .then(function (result) {

                        if (result.records && result.records.length === 1) {
                            return result.records[0].Id;
                        } else {
                            return null;
                        }
                    })
                    .then(function (groupId) {
                        if (groupId) {
                            return service.addFileShareMember(fileId, groupId, shareType);
                        } else {
                            return -1;
                        }
                    })
                    .then(function (res) {
                        if (res === -1) {
                            deferred.reject({message: 'No collaboration group: ' + collaborationGroupName + ', please contact to system admin to be a member of it and then retry.'});
                        } else {
                            deferred.resolve();
                        }
                    })
                    .catch(function (error) {
                        if (error.message) {
                            error.message = 'No access to collaboration group: ' + collaborationGroupName + ', please contact to system admin to be a member of it and then retry.'
                        }
                        deferred.reject(error);
                    });

                return deferred.promise;
            };

            /**
             * Create a document under a specific folder.
             *
             * @param {string} documentName document name
             * @param {string} documentBody document content data base64string
             * @param {string} description document description
             * @param {string} keywords
             * @param {string} folderId storing document folder id in salesforce
             * @param {string} type file extension
             *
             * @returns {*|promise}
             */
            service.createDocument = function (documentName, documentBody, description, keywords, folderId, type) {
                var deferred = $q.defer();

                var documentFields = {
                    Name: documentName,
                    Body: documentBody,
                    Description: description,
                    Keywords: keywords,
                    FolderId: folderId,
                    Type: type
                };

                var forceClient = ForceClientService.getForceClient();
                forceClient.create('Document', documentFields, function (success) {
                    void 0;
                    deferred.resolve(success);
                }, function (error) {
                    void 0;
                    $log.warn(new Exception(null, error.status, error.message, error.stack, error));
                    deferred.reject(error);
                });

                return deferred.promise;
            };

            /**
             * Create a document under a specific folder.
             *
             * @param {string} documentName document name
             * @param {string} documentBody document content data base64string
             * @param {string} description document description
             * @param {string} keywords
             * @param {string} folderDevelopName storing document folder develop name in salesforce
             * @param {string} type file extension
             *
             * @returns {*|promise}
             */
            service.createDocumentByFolderName = function (documentName, documentBody, description, keywords, folderDevelopName, type) {
                var deferred = $q.defer();

                var soql = 'select Id from Folder where DeveloperName = \'' + folderDevelopName + '\'';

                service.query(soql)
                    .then(function (result) {

                        if (result.records && result.records.length === 1) {
                            return result.records[0].Id;
                        } else {
                            return null;
                        }
                    })
                    .then(function (folderId) {
                        if (folderId) {
                            return service.createDocument(documentName, documentBody, description, keywords, folderId, type);
                        } else {
                            return -1;
                        }
                    })
                    .then(function (res) {
                        if (res === -1) {
                            deferred.reject('Not found the folder whose developName is ' + folderDevelopName + '.');
                        } else {
                            deferred.resolve();
                        }
                    })
                    .catch(function (error) {
                        deferred.reject(error);
                    });

                return deferred.promise;
            };

            /**
             * get Attachments for Parent Object
             * @param {string} parentId Salesforce Id of parent object
             * @param {string} condition WHERE clause for SOQL statement without WHERE
             * @param {string} order ORDER BY for SOQL statement without ORDER BY
             */
            service.getAttachmentsForParent = function (parentId, condition, order) {
                var deferred = $q.defer();

                var objectType = 'Attachment';

                LocalDataService.soqlFieldsForObjectType(objectType).then(function (fields) {

                    var soql = 'SELECT ' + fields.toString() + ' FROM ' + objectType + ' WHERE ParentId=\'' + parentId + '\'';

                    if (condition !== '') {
                        soql = soql + ' AND ' + condition;
                    }

                    if (order !== '') {
                        soql = soql + ' ORDER BY ' + order;
                    }

                    var forceClient = ForceClientService.getForceClient();

                    forceClient.query(soql, function (result) {
                        void 0;

                        var attachments = [];

                        angular.forEach(result.records, function (entry) {
                            var attachment = {};

                            angular.forEach(fields, function (field) {
                                if (entry.hasOwnProperty(field)) {
                                    attachment[field] = entry[field];
                                }
                            });

                            attachments.push(attachment);
                        });

                        deferred.resolve(attachments);
                    }, function (error) {
                        void 0;
                        $log.warn(new Exception(null, error.status, error.message, error.stack, error));
                        deferred.reject('Failed to Load Data.');
                    });
                }, function (error) {
                    deferred.reject(error);
                });

                return deferred.promise;
            };
        });
})(angular);

(function (angular) {
    'use strict';

    /**
     * Module oinio.core SalesforceLoginService
     */
    angular.module('oinio.core')
        .service('SalesforceLoginService', function (ForceClientService, SalesforceDataService, $http, $q, LocalCacheService, MetaService, LocalDataService, FileService, APP_SETTINGS, ConnectionMonitor, $log, Exception, EXCEPTION_SEVERITY) {
            var service = this;

            service.logout = function () {

                // Clear up user folders
                FileService.clearUserFolder().then(function () {
                    cordova.require('com.salesforce.plugin.sfaccountmanager').logout();
                }, function (error) {
                    throw error;
                });
            };

            /**
             * oauth authentication
             * @param {function} callback
             * @param {function} failCallBack
             */
            service.oauthLogin = function (callback, failCallBack) {
                // Get SalesforceMobileSK OAuth plugin
                var oauthPlugin = cordova.require('com.salesforce.plugin.oauth');

                // Call getAuthCredentials to get the initial session credentials
                oauthPlugin.getAuthCredentials(
                    // Callback method when authentication succeeds.
                    function (credentials) {
                        // Create forcetk client instance for rest API calls
                        var forceClient = new forcetk.Client(credentials.clientId, credentials.loginUrl, null);
                        forceClient.setSessionToken(credentials.accessToken, 'v36.0', credentials.instanceUrl);
                        forceClient.setRefreshToken(credentials.refreshToken);
                        forceClient.setUserAgentString(credentials.userAgent);

                        ForceClientService.setForceClient(forceClient);

                        // Load user info and set to user info object
                        SalesforceDataService.loadUserInfo().then(function (userInfoObject) {

                            // push user info object into cache
                            LocalCacheService.set('userInfo', userInfoObject);
                            LocalCacheService.set('currentUser', userInfoObject['currentUser']);
                            void 0;

                            // Get new user's profile id by user above, and get old user's profile id by _meta
                            if (ConnectionMonitor.isOnline()) {

                                var userCurrentProfileId = userInfoObject['currentUser']['ProfileId'];

                                _checkMobileConfigChanged(userCurrentProfileId).then(function (checkResult) {

                                    var doLogout = checkResult.doLogout || false, isMetaSoupExist = checkResult.isMetaSoupExist || false;
                                    if (doLogout) {
                                        $log.debug('Mobile configuration of the current login user has been changed, logout.');
                                        service.logout();
                                    } else {
                                        // Save user meta, including profile id
                                        void 0;
                                        if (isMetaSoupExist) {

                                            // check if user language is changed
                                            MetaService.getMetaValue('userInfo').then(function (localUserInfo) {

                                                MetaService.setMetaValue('userInfo', userInfoObject);

                                                if (localUserInfo && userInfoObject && localUserInfo['currentUser'].LanguageLocaleKey !== userInfoObject['currentUser'].LanguageLocaleKey) {
                                                    userInfoObject['currentUser'].isLanguageChanged = true;
                                                }

                                                if (callback) {
                                                    callback();
                                                }
                                            }, function (err) {
                                                $log.error('err: ' + JSON.stringify(err));
                                            });
                                        } else {
                                            if (callback) {
                                                callback();
                                            }
                                        }
                                    }
                                }, function (err) {
                                    $log.error('err: ' + JSON.stringify(err));
                                });
                            }
                            else {
                                if (callback) {
                                    callback();
                                }
                            }
                        }, function (err) {
                            $log.error('err: ' + JSON.stringify(err));
                        });
                    },
                    failCallBack
                );
            };

            // if _meta.user is not existing, then skip drop database logic, otherwise, do below
            // to get new configuraion, call online service
            // to get old configuraion, call queryConfigurationAndObjects(_meta.userInfo.currentUser.ProfileId)
            // compare above
            function _checkMobileConfigChanged(userCurrentProfileId) {
                var deferred = $q.defer();

                var handleError = function (error) {
                    if (error && typeof error.handle === 'function') {
                        error.retry = _checkMobileConfigChanged;
                        error.retryParam = userCurrentProfileId;
                        error.retryDeferred = deferred;
                        error.handle();
                    } else {
                        new Exception(EXCEPTION_SEVERITY.RECOVERABLE, error.status, error.message, error.stack, error, _checkMobileConfigChanged, null, null, userCurrentProfileId, deferred).handle();
                    }
                    deferred.reject(error);
                };

                var result = {
                    doLogout: false,
                    isMetaSoupExist: false
                };

                _isSoupExist('_meta').then(function (exist) {
                    if (exist === true) {
                        result.isMetaSoupExist = true;

                        // No need to check if online mobile configuration is changed when using local configuration.
                        if (APP_SETTINGS.LOCAL_CONFIGURATION === true) {
                            deferred.resolve(result);
                            return;
                        }

                        MetaService.getMetaValue('userInfo').then(function (userInfo) {
                            if (userInfo) {
                                var localProfileId = userInfo['currentUser']['ProfileId'];

                                // get local configuration sfdc id
                                LocalDataService.queryConfigurationAndObjects(localProfileId).then(function (configuraion) {
                                    if (configuraion && configuraion['Id']) {
                                        var localMobileConfigId = configuraion['Id'];

                                        // get current login user mobile configuraion id from sfdc
                                        SalesforceDataService.query('select Id, MobileVizArt__Profiles__c from MobileVizArt__Mobile_Configuration__c').then(function (data) {
                                            var onlineCurrentUserMobileConfigIds = [];
                                            angular.forEach(data.records || [], function (item) {
                                                if (item['MobileVizArt__Profiles__c'] && item['MobileVizArt__Profiles__c'].indexOf(userCurrentProfileId) > -1) {
                                                    if (onlineCurrentUserMobileConfigIds.indexOf(item['Id']) === -1) {
                                                        onlineCurrentUserMobileConfigIds.push(item['Id']);
                                                    }
                                                }
                                            });

                                            if (onlineCurrentUserMobileConfigIds.indexOf(localMobileConfigId) === -1) {
                                                // config changed, we need drop database
                                                void 0;
                                                result.doLogout = true;
                                                deferred.resolve(result);
                                            } else {
                                                void 0;
                                                result.doLogout = false;
                                                deferred.resolve(result);
                                            }
                                        }, function (err) {
                                            handleError(err);
                                        });
                                    } else {
                                        // no local config found, do logout
                                        void 0;
                                        result.doLogout = true;
                                        deferred.resolve(result);
                                    }
                                }, function (err) {
                                    handleError(err);
                                });
                            } else {
                                // no local user, do initialize
                                void 0;
                                result.doLogout = false;
                                deferred.resolve(result);
                            }
                        }, function (err) {
                            handleError(err);
                        });
                    } else {
                        // soup not initialized, do initialize
                        void 0;
                        deferred.resolve(result);
                    }
                }, function (err) {
                    handleError(err);
                });

                return deferred.promise;
            }

            function _isSoupExist(soupName) {
                return $q(function (resolve, reject) {
                    navigator.smartstore.soupExists(soupName, function (exist) {
                        void 0;
                        resolve(exist);
                    }, function (err) {
                        reject(err);
                    });
                });
            }

            /**
             * currently logged in user
             */
            service.getCurrentUserFromPlugin = function (success, fail) {
                cordova.require('com.salesforce.plugin.sfaccountmanager').getCurrentUser(success, fail);
            };

            /**
             * @desc get all logged in users
             * @param {*} success
             * @param {*} fail
             */
            service.getUsers = function (success, fail) {
                cordova.require('com.salesforce.plugin.sfaccountmanager').getUsers(success, fail);
            };

            /**
             * @desc switch to user
             */
            service.switchToUser = function () {
                cordova.require('com.salesforce.plugin.sfaccountmanager').switchToUser(null);
            };

            /**
             * @desc logout current user and drop database
             */
            service.logoutAndDrop = function () {
                navigator.notification.confirm('Do you really want to logout? All local data will be lost.', function (buttonIndex) {
                    switch (buttonIndex) {
                        case 1:
                            // Clear up user folders
                            FileService.clearUserFolder().then(function () {
                                cordova.require('com.salesforce.plugin.sfaccountmanager').logout();    
                            }, function (error) {
                                throw error;
                            });
                            break;
                    }
                }, 'Logout', ['Yes', 'No']);
            };

            /**
             * web login with frontdoor.jsp
             */
            service.webLogin = function () {
                var deferred = $q.defer();

                var forceClient = ForceClientService.getForceClient();

                var url = forceClient.instanceUrl + '/secur/frontdoor.jsp?sid=' + forceClient.sessionId;

                $http.get(url).then(function () {
                    void 0;
                    deferred.resolve();
                }, function (error) {
                    deferred.reject(error);
                });

                return deferred.promise;
            };
        });
})(angular);

(function (angular) {
    'use strict';

    /**
     * Module oinio.core SmartStoreService
     */
    angular.module('oinio.core')

        .constant('SMARTSTORE_SOUP_STATUS', {
            SOUP_CREATED: 'SOUP_CREATED',
            SOUP_EXIST: 'SOUP_EXIST'
        })

        .constant('SMARTSTORE_COMMON_SETTING', {
            SOUP_NAME_QUEUE: '_queue',
            PAGE_SIZE_FOR_ALL: 100000000,
            QUEUE_MESSAGE_ACTION_INSERT: 'INSERT',
            QUEUE_MESSAGE_ACTION_UPDATE: 'UPDATE',
            QUEUE_MESSAGE_ACTION_DELETE: 'DELETE',
            QUEUE_MESSAGE_ERROR_STATE: 'error',
            REFERENCED_FIELD_EXTENSION_SUFFIX: '_sid',
            REFERENCED_FIELD_TYPE_SUFFIX: '_type'
        })

        .service('SmartStoreService', function ($injector, $q, SMARTSTORE_SOUP_STATUS, ConfigurationService, APP_SETTINGS, MetaService, LocalSyncService, LocalCacheService, UtilService) {
            var service = this;

            var Exception = $injector.get('Exception');
            var EXCEPTION_SEVERITY = $injector.get('EXCEPTION_SEVERITY');
            var PROCESS_CODE = $injector.get('PROCESS_CODE');
            var STATUS_CODE = $injector.get('STATUS_CODE');

            /**
             * setup global soups
             * @returns {Promise}
             */
            function setupGlobalSoups() {

                var deferred = $q.defer();

                var promises = [];

                ConfigurationService.globalSoupSettings().then(function (globalSoupSettings) {
                    angular.forEach(globalSoupSettings, function (soup) {
                        promises.push(registerSoup(true, soup.name, soup.indexSpec, soup.externalStorage));
                    });

                    $q.all(promises).then(function (result) {
                        deferred.resolve(result);
                    }, function (error) {
                        deferred.reject(error);
                    });
                }, function (error) {
                    deferred.reject(error);
                });

                return deferred.promise;
            }

            /**
             * setup framework soups
             * @returns {Promise}
             */
            function setupFrameworkSoups() {

                var deferred = $q.defer();

                var promises = [];

                ConfigurationService.frameworkSoupSettings().then(function (frameworkSoupSettings) {
                    angular.forEach(frameworkSoupSettings, function (soup) {
                        promises.push(registerSoup(false, soup.name, soup.indexSpec, soup.externalStorage));
                    });

                    $q.all(promises).then(function (result) {
                        deferred.resolve(result);
                    }, function (error) {
                        deferred.reject(error);
                    });
                }, function (error) {
                    deferred.reject(error);
                });

                return deferred.promise;
            }

            /**
             * setup user specific soups from configuration
             * @param {array} soupSettings
             * @returns {Promise}
             */
            function setupSObjectSoups(soupSettings) {

                var deferred = $q.defer();

                var promises = [];

                angular.forEach(soupSettings, function (soup) {
                    promises.push(registerSoup(false, soup.name, soup.indexSpec, soup.externalStorage));

                    // If soup is Attachment, add creating AttachmentBody soup for saving Attachment body.
                    if (soup.name === 'Attachment') {
                        promises.push(registerSoup(false, 'AttachmentBody', [{
                            'path': 'AttachmentSid',
                            'type': 'string'
                        }]));
                    }
                });

                $q.all(promises).then(function (result) {
                    deferred.resolve(result);
                }, function (error) {
                    deferred.reject(error);
                });

                return deferred.promise;
            }

            /**
             * setup global soups, framework soups and user specific soups
             * @returns {Promise}
             */
            service.setupSoups = function () {

                var deferred = $q.defer();

                var handleError = function (error) {
                    if (error && typeof error.handle === 'function') {
                        error.retry = _retrySetupSoups;
                        error.retryDeferred = deferred;
                        error.handle();
                    } else {
                        new Exception(EXCEPTION_SEVERITY.RECOVERABLE, error.status, error.message, error.stack, error, _retrySetupSoups, null, null, null, deferred).handle();
                    }
                    deferred.reject(error);
                };

                setupGlobalSoups().then(function () {
                    void 0;

                    setupFrameworkSoups().then(function () {
                        void 0;

                        // add current user info to _meta
                        var userInfo = LocalCacheService.get('userInfo');
                        MetaService.setMetaValue('userInfo', userInfo);

                        // Setup user soups and _obectMeta
                        // if (APP_SETTINGS.LOCAL_CONFIGURATION === true) {
                        //
                        //     setupBusinessSoups().then(function () {
                        //         deferred.resolve(true);
                        //     }, function (error) {
                        //         deferred.reject(error);
                        //     });
                        // } else {

                        // Sync Mobile / Remote Configurations mainly of Mobile_Configuration__c, Mobile_Object__c and Describes
                        // as well as Local Configuration if without being in package.
                        LocalSyncService.syncMobileConfiguration().then(function (result) {

                            setupBusinessSoups().then(function () {

                                MetaService.setMetaValue('allSoupName', allSoupName);
                                deferred.resolve(true);
                            }, function (error) {
                                handleError(error);
                            });
                        }, function (error) {
                            handleError(error);
                        });
                    }, function (error) {
                        handleError(error);
                    });
                }, function (error) {
                    handleError(error);
                });

                return deferred.promise;
            };

            /**
             * Retry setup global soups, framework soups and user specific soups
             * @returns {Promise}
             */
            var _retrySetupSoups = function () {

                var deferred = $q.defer();

                // drop synchronized data from device to get a clear environment
                service.dropSoupByConfig(false, false, true).then(function () {

                    return service.setupSoups();
                }).then(function (success) {
                    deferred.resolve(success);
                }).catch(function (error) {
                    deferred.reject(error);
                });

                return deferred.promise;
            };

            var setupBusinessSoups = function () {
                var deferred = $q.defer();

                ConfigurationService.objectTypeSoupSettings().then(function (soupSettings) {
                    if (soupSettings.length > 0) {

                        setupSObjectSoups(soupSettings).then(function () {

                            void 0;

                            MetaService.setSoupInitialized();

                            // create object type names array
                            var objectTypeNames = [];
                            angular.forEach(soupSettings, function (soup) {
                                objectTypeNames.push(soup.objectTypeName);
                            });
                            MetaService.initializeMetaDataForObjectTypes(objectTypeNames).then(function () {
                                deferred.resolve(true);
                            }, function (error) {
                                deferred.reject(error);
                            });
                        }, function (error) {
                            deferred.reject(error);
                        });
                    } else {
                        deferred.resolve(true);
                    }
                }, function (error) {
                    deferred.reject(error);
                });

                return deferred.promise;
            };

            /**
             * register soup
             * @param {boolean} isGlobal
             * @param {string} soupName
             * @param {object} indexSpec
             * @param [boolean] isExternalStorage
             * @returns {*}
             */
            var registerSoup = function (isGlobal, soupName, indexSpec, isExternalStorage) {
                var deferred = $q.defer();

                navigator.smartstore.soupExists(isGlobal, soupName, function (exists) {

                    // Initialize soup if not existing
                    if (!exists) {
                        void 0;
                        void 0;

                        if (isExternalStorage && typeof navigator.smartstore.registerSoupWithSpec === 'function' && UtilService.isAndroidOS()) {
                            navigator.smartstore.registerSoupWithSpec(isGlobal, {name: soupName, features: ['externalStorage']}, indexSpec, function(param){
                                void 0;
                                pushSoupNameCache(isGlobal, soupName);
                                deferred.resolve(SMARTSTORE_SOUP_STATUS.SOUP_CREATED);
                            }, function (error) {
                                void 0;
                            });
                        } else {
                            navigator.smartstore.registerSoup(isGlobal, soupName, indexSpec, function (param) {
                                void 0;
                                pushSoupNameCache(isGlobal, soupName);
                                deferred.resolve(SMARTSTORE_SOUP_STATUS.SOUP_CREATED);
                            }, function (error) {
                                void 0;
                            });
                        }

                    } else {
                        void 0;
                        pushSoupNameCache(isGlobal, soupName);
                        deferred.resolve(SMARTSTORE_SOUP_STATUS.SOUP_EXIST);
                    }
                }, function (error) {
                    deferred.reject(error);
                });

                return deferred.promise;
            };

            /**
             * Remove soup from device, including global soups, framework soups and object soups.
             *
             * @param {boolean} [skipObjectSoups]
             * @param {boolean} [skipFrameworkSoups]
             * @param {boolean} [skipGlobalSoups]
             * @returns {*|promise}
             */
            service.dropSoupByConfig = function (skipObjectSoups, skipFrameworkSoups, skipGlobalSoups) {

                var deferred = $q.defer();

                var removeSoupPromises = [];
                var findConfigPromises = [];

                var addRemoveSoup = function (isGlobal, soupSettings) {

                    angular.forEach(soupSettings, function (soup) {
                        removeSoupPromises.push(removeSoup(isGlobal, soup.name));
                    });
                };

                // if not skipGlobalSoups, remove global soups
                if (!skipGlobalSoups) {
                    var promise = ConfigurationService.globalSoupSettings().then(function (globalSoupSettings) {
                        addRemoveSoup(true, globalSoupSettings);
                    });

                    findConfigPromises.push(promise);
                }

                // if not skipFrameworkSoups, remove framework soups
                if (!skipFrameworkSoups) {
                    var promise2 = ConfigurationService.frameworkSoupSettings().then(function (frameworkSoupSettings) {
                        addRemoveSoup(false, frameworkSoupSettings);
                    });

                    findConfigPromises.push(promise2);
                }

                // if not skipObjectSoups, remove object soups
                if (!skipObjectSoups) {
                    var promise3 = ConfigurationService.objectTypeSoupSettings().then(function (objectSoupSettings) {
                        addRemoveSoup(false, objectSoupSettings);
                    }, function (error) {
                        // TODO: handle the error
                        void 0;
                    });

                    findConfigPromises.push(promise3);
                }

                $q.all(findConfigPromises).then(function () {

                    return $q.all(removeSoupPromises);
                }).then(function () {
                    deferred.resolve();
                }).catch(function (error) {
                    deferred.reject(error);
                });

                return deferred.promise;
            };

            /**
             * Remove soup
             * @param {boolean} isGlobal
             * @param {string} soupName
             * @returns {*}
             */
            var removeSoup = function (isGlobal, soupName) {
                var deferred = $q.defer();

                navigator.smartstore.removeSoup(isGlobal, soupName, function (result) {
                    _.pull(allSoupName, getSoupNameKey(isGlobal, soupName));
                    deferred.resolve(result);
                }, function (error) {
                    deferred.reject(error);
                });

                return deferred.promise;
            };

            /**
             * Alter soup by config to make it be suit for external storage, including global soups, framework soups and object soups.
             *
             * @param {boolean} [skipObjectSoups]
             * @param {boolean} [skipFrameworkSoups]
             * @param {boolean} [skipGlobalSoups]
             * @returns {*|promise}
             */
            service.resetSoupSpecByConfig = function (skipObjectSoups, skipFrameworkSoups, skipGlobalSoups) {

                var deferred = $q.defer();

                // externalStorage is only used on Android devices so we can skip this implementation on iOS
                if(UtilService.isAndroidOS()) {
                    var alterSoupPromises = [];
                    var findConfigPromises = [];

                    var addAlterSoup = function (isGlobal, soupSettings) {

                        angular.forEach(soupSettings, function (soup) {
                            alterSoupPromises.push(resetSoupExternalStorage(isGlobal, soup.name, soup.indexSpec, soup.externalStorage));
                        });
                    };

                    // check whether the app version has been changed, then alter soup whose external storage config has been modified
                    checkAppVersionChanged().then(function (isChanged) {

                        // if not skipGlobalSoups, alter global soups
                        if (!skipGlobalSoups && isChanged) {
                            var promise = ConfigurationService.globalSoupSettings().then(function (globalSoupSettings) {
                                addAlterSoup(true, globalSoupSettings);
                            });

                            findConfigPromises.push(promise);
                        }

                        // if not skipFrameworkSoups, alter framework soups
                        if (!skipFrameworkSoups && isChanged) {
                            var promise2 = ConfigurationService.frameworkSoupSettings().then(function (frameworkSoupSettings) {
                                addAlterSoup(false, frameworkSoupSettings);
                            });

                            findConfigPromises.push(promise2);
                        }

                        // if not skipObjectSoups, alter object soups
                        if (!skipObjectSoups) {
                            var promise3 = ConfigurationService.objectTypeSoupSettings().then(function (objectSoupSettings) {
                                addAlterSoup(false, objectSoupSettings);
                            }, function (error) {
                                // TODO: handle the error
                                void 0;
                            });

                            findConfigPromises.push(promise3);
                        }

                        return $q.all(findConfigPromises);
                    }).then(function () {

                        return $q.all(alterSoupPromises);
                    }).then(function () {
                        deferred.resolve();
                    }).catch(function (error) {
                        deferred.reject(error);
                    });
                }
                else{
                    // on iOS externalStorage is not used
                    deferred.resolve();
                }

                return deferred.promise;
            };

            /**
             * Reset soup spec when the external storage config is changed. This changing is only for android platform.
             *
             * @param {boolean} isGlobal
             * @param {string} soupName
             * @param {Array} indexSpec
             * @param {boolean} isExternalStorage
             * @returns {*|promise}
             */
            var resetSoupExternalStorage = function (isGlobal, soupName, indexSpec, isExternalStorage) {
                var deferred = $q.defer();

                // when the salesforce mobile sdk version is above 4.2.0
                if (typeof navigator.smartstore.getSoupSpec === 'function' && UtilService.isAndroidOS()) {
                    navigator.smartstore.getSoupSpec(isGlobal, soupName, function (result) {

                        var noChange = true;
                        if (isExternalStorage && result.features.indexOf('externalStorage') === -1) {
                            result.features.push('externalStorage');
                            noChange = false;
                        }

                        if (!isExternalStorage && result.features.indexOf('externalStorage') !== -1) {
                            result.features.splice(result.features.indexOf('externalStorage'), 1);
                            noChange = false;
                        }

                        if (!noChange && typeof navigator.smartstore.alterSoupWithSpec === 'function') {

                            // when the salesforce mobile sdk version is above 4.2.0
                            navigator.smartstore.alterSoupWithSpec(isGlobal, soupName, {
                                name: soupName,
                                features: result.features
                            }, indexSpec, false, function (result) {
                                deferred.resolve(result);
                            }, function (error) {
                                deferred.reject(error);
                            });
                        } else {
                            deferred.resolve(true);
                        }
                    }, function (error) {
                        deferred.reject(error);
                    });
                } else {
                    deferred.resolve(true);
                }

                return deferred.promise;
            };

            /**
             * Check whether the app version is changed.
             *
             * @returns {*|promise}
             */
            var checkAppVersionChanged = function () {
                var deferred = $q.defer();

                var $cordovaAppVersion = $injector.get('$cordovaAppVersion');
                var oldAppVersion = '';

                // get the old app version from _meta
                MetaService.getMetaValueEnhance('appVersion').then(function (appVer) {
                    oldAppVersion = appVer;

                    // get the current app version
                    return $cordovaAppVersion.getVersionNumber();
                }).then(function (appVersion) {

                    // compare them, if unequal, the app version has been changed.
                    if (oldAppVersion !== appVersion) {
                        deferred.resolve(true);
                    } else {
                        deferred.resolve(false);
                    }
                }).catch(function (error) {
                    deferred.reject(error);
                });

                return deferred.promise;
            };

            // cache all soup name including global soup(name is "g|" + soupName) and not global soup (name is soupName)
            var allSoupName = [];

            function getSoupNameKey(isGlobal, soupName) {
                return (isGlobal ? 'g|' : '') + soupName;
            }

            function pushSoupNameCache(isGlobal, soupName) {
                var soupNameKey = getSoupNameKey(isGlobal, soupName);
                if (allSoupName.indexOf(soupNameKey) === -1) {
                    allSoupName.push(soupNameKey);
                }
            }

            /**
             * Check whether the soup is exist in smartStore.
             *
             * @param {string} soupName: the soup name
             * @param {boolean} [isGlobal] optional, default is false
             *
             * @returns {*|promise}
             **/
            service.checkSoupExist = function (soupName, isGlobal) {
                var deferred = $q.defer();

                if (allSoupName && allSoupName.length > 0) {
                    deferred.resolve((allSoupName.indexOf(getSoupNameKey(isGlobal, soupName)) !== -1));
                } else {
                    MetaService.getMetaValue('allSoupName').then(function (allSoupNameFromDB) {
                        allSoupName = allSoupNameFromDB;

                        if (allSoupName && allSoupName.length > 0) {
                            return allSoupName;
                        } else {
                            return resetAllSoupName();
                        }
                    }).then(function (allSoupName) {
                        deferred.resolve((allSoupName.indexOf(getSoupNameKey(isGlobal, soupName)) !== -1));
                    }).catch(function (error) {
                        deferred.reject(error);
                    });
                }

                return deferred.promise;
            };

            /**
             * Reset all the soup names cache in memory and _meta table.
             *
             * @returns {*|promise}
             **/
            var resetAllSoupName = function () {
                var deferred = $q.defer();
                var soupNames = [];

                getAllSoupName(false).then(function (localSoupNames) {
                    soupNames = localSoupNames;
                    return getAllSoupName(true);
                }).then(function (globalSoupNames) {
                    for (var i = 0; i < globalSoupNames.length; i++) {
                        globalSoupNames[i] = 'g|' + globalSoupNames[i];
                    }

                    allSoupName = soupNames.concat(globalSoupNames);
                    MetaService.setMetaValue('allSoupName', allSoupName);

                    deferred.resolve(allSoupName);
                }).catch(function (error) {
                    deferred.reject(error);
                });

                return deferred.promise;
            };

            /**
             * Get all the soup names which are exist in smartStore through querying "soup_attrs" table.
             *
             * @param {boolean} isGlobal
             *
             * @returns {*|promise}
             **/
            var getAllSoupName = function (isGlobal) {
                var deferred = $q.defer();

                var querySpec = navigator.smartstore.buildSmartQuerySpec('select soupname from soup_attrs', 1000);
                navigator.smartstore.runSmartQuery(isGlobal, querySpec, function (cursor) {
                    deferred.resolve(_.pluck(cursor.currentPageOrderedEntries, '0'));
                }, function (error) {
                    deferred.reject(error);
                });

                return deferred.promise;
            };
        });
})(angular, _);

(function (angular) {
    'use strict';

    /**
     * Module oinio.core UtilService
     */
    angular.module('oinio.core')
        .service('UtilService', function ($q, $http, $log, ForceClientService) {
            var service = this;

            /**
             * checks if device is online
             * @returns {Promise}
             */
            service.isDeviceOnline = function () {

                void 0;
                void 0;

                var deferred = $q.defer();

                // Depending on the device, a few examples are:
                //   - "Android"
                //   - "BlackBerry"
                //   - "iOS"
                //   - "webOS"
                //   - "WinCE"
                //   - "Tizen"
                if (service.isAndroidOS()) {

                    // as navigator.onLine property works for some Android devices, but not all, so we use ping salesforce instead of plugin method.
                    $http.get(ForceClientService.getForceClient().instanceUrl, {timeout: 10000}).then(function (response) {
                        deferred.resolve(true);
                    }, function (response) {
                        deferred.resolve(false);
                    });
                } else {
                    deferred.resolve(cordova.require('com.salesforce.util.bootstrap').deviceIsOnline());
                }

                return deferred.promise;
            };

            /**
             * checks if OS is Android
             * @returns {boolean}
             */
            service.isAndroidOS = function () {
                return device.platform === 'Android';
            };

            var userAgent = navigator.userAgent;
            var isWebkit = userAgent.indexOf('AppleWebKit') > 0;
            var isIPad = userAgent.indexOf('iPad') > 0;
            var isIOS = userAgent.indexOf('iPhone') > 0 || userAgent.indexOf('iPod') > 0;
            var isAndroid = userAgent.indexOf('Android') > 0;
            var isNewBlackBerry = userAgent.indexOf('AppleWebKit') > 0 && userAgent.indexOf('BlackBerry') > 0;
            var isWebOS = userAgent.indexOf('webOS') > 0;
            var isWindowsMobile = userAgent.indexOf('IEMobile') > 0;
            var isSmallScreen = screen.width < 767 || (isAndroid && screen.width < 1000);
            var isUnknownMobile = isWebkit && isSmallScreen;
            var isMobile = isIOS || isAndroid || isNewBlackBerry || isWebOS || isWindowsMobile || isUnknownMobile;
            var isTablet = isIPad || (isMobile && !isSmallScreen);

            /**
             * checks if device is mobile
             * @returns {boolean}
             */
            service.isMobile = function () {
                return isMobile;
            };

            /**
             * checks if device is tablet
             * @returns {boolean}
             */
            service.isTablet = function () {
                return isTablet;
            };

            /**
             *
             * @returns {boolean}
             */
            service.isMobileDevice = function () {
                return !!window.cordova;
            };

            service.Result = function (success, message, data) {
                this.success = success;
                this.message = message;
                this.data = data;
            };

            /**
             * convert string into boolean.
             * @param {string} bl
             * @returns {*}
             */
            service.convertStringToBoolean = function (bl) {
                if (bl === 'true' || bl === true) {
                    return true;
                } else if (bl === 'false' || bl === false) {
                    return false;
                } else {
                    return undefined;
                }
            };

            /**
             * get dependent value of picklist according to selected controller field value if this picklist is dependent
             *
             * @param {Array} picklistValues all picklist values
             * @param {Array} controllerPicklistValues all controller picklist values
             * @param {string} selectedParentValue selected controller pickist value
             * @returns {Array}
             */
            service.getDependentValues = function (picklistValues, controllerPicklistValues, selectedParentValue) {
                var dependentValues = [];

                // sub function to do the validFor test
                var isDependentValue = function (index, validFor) {
                    var base64 = new sforce.Base64Binary('');
                    var decoded = base64.decode(validFor);
                    var bits = decoded.charCodeAt(index >> 3);

                    return ((bits & (0x80 >> (index % 8))) != 0);
                };

                if (selectedParentValue) {
                    angular.forEach(controllerPicklistValues, function (controllerItem, index) {
                        if (controllerItem.masterValue.toLowerCase() === selectedParentValue.toLowerCase()) {
                            angular.forEach(picklistValues, function (item) {
                                if (isDependentValue(index, item.validFor)) {
                                    dependentValues.push(item);
                                }
                            });
                        }
                    });
                }

                return dependentValues;
            };

            /*
             Salesforce.com AJAX Connector 34.0
             Copyright, 1999, salesforce.com, inc.
             All Rights Reserved
             ---------------------- start -----------------------
             */
            var sforce = {};

            /** Base64Binary */
            sforce.Base64Binary = function (text) {
                this.input = text;
            };

            sforce.Base64Binary.prototype.keyStr = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';

            sforce.Base64Binary.prototype.toString = function () {
                var output = [];
                var chr1, chr2, chr3 = '';
                var enc1, enc2, enc3, enc4 = '';
                var i = 0;
                do {
                    chr1 = this.input.charCodeAt(i++);
                    chr2 = this.input.charCodeAt(i++);
                    chr3 = this.input.charCodeAt(i++);
                    enc1 = chr1 >> 2;
                    enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
                    enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
                    enc4 = chr3 & 63;
                    if (isNaN(chr2)) {
                        enc3 = enc4 = 64;
                    } else if (isNaN(chr3)) {
                        enc4 = 64;
                    }
                    output.push(this.keyStr.charAt(enc1) + this.keyStr.charAt(enc2) + this.keyStr.charAt(enc3) + this.keyStr.charAt(enc4));
                    chr1 = chr2 = chr3 = '';
                    enc1 = enc2 = enc3 = enc4 = '';
                } while (i < this.input.length);
                return output.join('');
            };

            sforce.Base64Binary.prototype.decode = function (input) {
                var output = [];
                var chr1, chr2, chr3 = '';
                var enc1, enc2, enc3, enc4 = '';
                var i = 0;
                var base64test = /[^A-Za-z0-9\+\/\=]/g;
                if (base64test.exec(input)) {
                    $log.debug('There were invalid base64 characters in the input text.\n' +
                        'Valid base64 characters are A-Z, a-z, 0-9, \'+\', \'/\', and \'=\'\n' + 'Expect errors in decoding.'
                    );
                }
                input = input.replace(/[^A-Za-z0-9\+\/\=]/g, '');
                do {
                    enc1 = this.keyStr.indexOf(input.charAt(i++));
                    enc2 = this.keyStr.indexOf(input.charAt(i++));
                    enc3 = this.keyStr.indexOf(input.charAt(i++));
                    enc4 = this.keyStr.indexOf(input.charAt(i++));
                    chr1 = (enc1 << 2) | (enc2 >> 4);
                    chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
                    chr3 = ((enc3 & 3) << 6) | enc4;
                    output.push(String.fromCharCode(chr1));
                    if (enc3 != 64) {
                        output.push(String.fromCharCode(chr2));
                    }
                    if (enc4 != 64) {
                        output.push(String.fromCharCode(chr3));
                    }
                    chr1 = chr2 = chr3 = '';
                    enc1 = enc2 = enc3 = enc4 = '';
                } while (i < input.length);
                return output.join('');
            };

            /*
             Salesforce.com AJAX Connector 34.0
             Copyright, 1999, salesforce.com, inc.
             All Rights Reserved
             ---------------------- end -----------------------
             */
        });
})(angular);

(function (angular) {

    'use strict';

    angular.module('oinio.core.components')
        .component('actionFooterBar', {
            transclude: 'true',
            templateUrl: 'app/core/components/action-footer-bar.component/action-footer-bar.component.html',
            bindings: {
                objectType: '<',
                sobject: '<'
            },
            controller: function ($scope, $http, $ionicPopup, $log, $state, PageLayoutService, ModalService,
                                  IonicLoadingService, LocalDataService, LocalSyncService, ConnectionMonitor ) {
                var ctrl = this;
                var objectType = ctrl.objectType;

                //ctrl.sobject = ctrl.sobject;

                // debugger;

                this.$onInit = function () {
                    // Get Configuration from JSON-File for Action Footer Bar.
                    $http.get('app/common/configuration/action-footer-bar.json').success(function (data) {
                        if (data.objectType.hasOwnProperty(objectType)) {
                            var oActions = data.objectType[objectType];
                            for (var sAction in oActions) {
                                switch (sAction) {
                                    case 'isEdit':
                                        ctrl.isEdit = oActions[sAction];
                                        break;
                                    case 'isCall':
                                        ctrl.isCall = oActions[sAction];
                                        break;
                                    case 'isLogACall':
                                        ctrl.isLogACall = oActions[sAction];
                                        break;
                                    case 'isNewVisit':
                                        ctrl.isNewVisit = oActions[sAction];
                                        break;
                                    case 'isNewEvent':
                                        ctrl.isNewEvent = oActions[sAction];
                                        break;
                                    case 'isNewTask':
                                        ctrl.isNewTask = oActions[sAction];
                                        break;
                                    case 'isNewContact':
                                        ctrl.isNewContact = oActions[sAction];
                                        break;
                                    case 'isSharePost':
                                        ctrl.isSharePost = oActions[sAction];
                                        break;
                                    case 'isShowMore':
                                        ctrl.isShowMore = oActions[sAction];
                                        break;
                                }
                            }
                        }
                    });
                };

                /**
                 * synchronize to salesforce if device is online
                 */
                function synchronize(objectType) {
                    if (ConnectionMonitor.isOnline()) {
                        IonicLoadingService.show($filter('translate')('cl.sync.lb_synchronizing'));
                        LocalSyncService.syncUpObjectByName(objectType).then(function () {
                            IonicLoadingService.hide();
                            loadErrorMessages();
                        }, function (error) {
                            // TODO: This is only a quick and very dirty fix. Use $q.defer / reject / resolve instead
                            // hide spinner
                            IonicLoadingService.hide();

                            var alertPopup = $ionicPopup.alert({
                                title: 'Synchronization failed.',
                                template: 'Please contact your administrator, if the problem persists.<br /><br /><span style="color:#CCCCCC">' + error + '</span>'
                            });

                            alertPopup.then(function(result) {
                                $log.error('errormessages.component::synchronize failure ==> ' + error);
                                $state.go(APP_SETTINGS.START_VIEW);
                            });
                        });
                    }
                }

                /**
                 * @desc open the edit detail for page layout in modal
                 * @func editDetails
                 */
                this.editDetails = function () {
                    // debugger;
                    PageLayoutService.generatePageLayoutForSObject(ctrl.sobject, true).then(function (pageLayoutResult) {

                        ModalService.show('app/core/modal/templates/edit.record.modal.view.html', 'SaveModalController as vm', {
                            layout: pageLayoutResult.layout,
                            sobject: ctrl.sobject
                        }, {
                            animation: 'slide-in-up',
                            focusFirstInput: false,
                            backdropClickToClose: false,
                            hardwareBackButtonClose: false
                        }).then(function (save) {

                            if (save === true) {
                                IonicLoadingService.show($filter('translate')('cl.sync.lb_saving'));

                                LocalDataService.updateSObjects(ctrl.sobject.attributes.type, [ctrl.sobject]).then(function (saveSuccess) {
                                    IonicLoadingService.hide();

                                    synchronize(ctrl.sobject.attributes.type);
                                }, function (error) {
                                    $log.error('>>>> Error in actionFooterBar component while saving an record in editDetails(): ' + error);
                                });
                            }
                        }, function (error) {
                            $log.error('>>>> Error in actionFooterBar component ctrl - editDetails(): ' + error);
                        });
                    }, function (err) {
                        $log.log('>>>> editDetails() err in actionFooterBar component');
                    });
                };


            }
        });
})(angular);

(function (angular, moment) {

    'use strict';

    angular.module('oinio.core.components')
        .component('dateInput', {
            templateUrl: 'app/core/components/date-input.component/date-input.component.html',
            require: {
                form: '^form'
            },
            bindings: {
                value: '=',
                fieldname: '<',
                fieldlabel: '<',
                fieldtype: '<',
                required: '<'
            },
            controller: function ($filter, $timeout, LocalCacheService, localizeService) {

                var currentUser = LocalCacheService.get('currentUser');

                this.selectedTime = null;
                this.sfdcDate = null;

                this.setDate = function () {
                    var lt = this.selectedTime;

                    if (lt && currentUser) {

                        if (this.fieldtype === 'date') {
                            // set current time in sfTime. Problem is, sfTime hat time 00:00:00 and if we than set the UTC time is it is possible that the wrong date is saves
                            // sfTime = 2016-07-22 00:00:00 => utc offset is then in case of e.g. GMT +2 2016-07-21 22:00:00 ==> so the wrong date is used
                            var currentTime = new Date();
                            lt.setHours(currentTime.getHours());
                            lt.setMinutes(currentTime.getMinutes());
                            lt.setSeconds(currentTime.getSeconds());
                        }

                        // convert local time to salesforce time
                        var sfTime = moment().tz(currentUser['TimeZoneSidKey'])
                            .year(lt.getFullYear()).month(lt.getMonth()).date(lt.getDate())
                            .hour(lt.getHours()).minute(lt.getMinutes()).second(lt.getSeconds()).millisecond(lt.getMilliseconds());

                        if (this.fieldtype === 'datetime') {
                            this.value = sfTime.utcOffset(0).format('YYYY-MM-DDTHH:mm:ss.SSSZZ');
                            this.sfdcDate = sfTime.toISOString();
                        } else {
                            this.value = sfTime.utcOffset(0).format('YYYY-MM-DD');
                            this.sfdcDate = this.value;
                        }

                        // set value in form
                        //this.form[this.fieldname].$setViewValue(this.sfdcDate);

                        // set value fake formatedDate input in form
                        this.formatedDate = localizeService.getFormattedString(this.sfdcDate, this.fieldtype);
                    }
                    else if (!lt) {
                        this.sfdcDate = null;
                    }

                    //this.form[this.fieldname].$setTouched();
                };

                this.$onInit = function () {

                    if (this.value && currentUser) {

                        var timezone = currentUser['TimeZoneSidKey'];
                        // convert datetime string with salesforce user timezone
                        var sfTime = moment.tz(this.value, timezone);

                        // prepare date for display with local html5 input type date|datetime
                        this.selectedTime = new Date(sfTime.year(), sfTime.month(), sfTime.date(), sfTime.hour(), sfTime.minute(), sfTime.second(), sfTime.millisecond());

                        // set value initialize in sfdcDate for Validation
                        this.sfdcDate = this.value;
                    }

                    this.formatedDate = localizeService.getFormattedString(this.selectedTime, this.fieldtype);
                };
            },
            transclude: 'true',
            controllerAs: '$ctrl'
        });
})(angular, moment);

(function (angular) {
    'use strict';

    angular.module('oinio.core.logger')
        .service('Logger', function ($filter, $injector) {

            var service = {
                enabled: false,
                logToConsole: true,
                logToSoup: true,
                logToFile: {
                    headerInfo: '',
                    debug: false,
                    info: false,
                    warn: false,
                    error: true,
                    log: false,
                    setting: function () {
                        service.logToFile.debug = arguments[0];
                        service.logToFile.info = arguments[1];
                        service.logToFile.warn = arguments[2];
                        service.logToFile.error = arguments[3];
                        service.logToFile.log = arguments[4];
                    }
                },
                debug: function () {
                    var params = {
                        type: 'debug',
                        exceptions: arguments,
                        includeStack: false,
                        showAlert: false,
                        logToFile: service.logToFile.debug
                    };
                    log(params);
                },
                error: function () {
                    var params = {
                        type: 'error',
                        exceptions: arguments,
                        includeStack: true,
                        showAlert: true,
                        logToFile: service.logToFile.error
                    };
                    log(params);
                },
                warn: function () {
                    var params = {
                        type: 'warn',
                        exceptions: arguments,
                        includeStack: false,
                        showAlert: false,
                        logToFile: service.logToFile.warn
                    };
                    log(params);
                },
                info: function () {
                    var params = {
                        type: 'info',
                        exceptions: arguments,
                        includeStack: false,
                        showAlert: false,
                        logToFile: service.logToFile.info
                    };
                    log(params);
                },
                log: function () {
                    var params = {
                        type: 'log',
                        exceptions: arguments,
                        includeStack: false,
                        showAlert: false,
                        logToFile: service.logToFile.log
                    };
                    log(params);
                }
            };

            /**
             * Initialize log setting from last setting in meta soup or get default setting,
             * and initialize log level and Log folder for storing logging file.
             *
             * @returns {*|promise}
             */
            service.initializeLogSetting = function () {
                var deferred = $injector.get('$q').defer();
                var LOG_SETTING = $injector.get('LOG_SETTING');
                var logLevel = LOG_SETTING.LOG_LEVEL;

                switch (logLevel) {
                    case 'debug' :
                        service.logToFile.setting(true, true, true, true, true);
                        break;
                    case 'info' :
                        service.logToFile.setting(false, true, true, true, true);
                        break;
                    case 'warn' :
                        service.logToFile.setting(false, false, true, true, true);
                        break;
                    case 'error' :
                        service.logToFile.setting(false, false, false, true, true);
                        break;
                    case 'log' :
                        service.logToFile.setting(false, false, false, false, true);
                        break;
                    default:
                        service.logToFile.setting(false, false, false, false, false);
                        break;
                }

                setLoggingRelatedInfo()
                    .then(function () {
                        return $injector.get('MetaService').getMetaValueEnhance('logging');
                    })
                    .then(function (logging) {
                        if (logging === undefined || logging === null) {
                            logging = LOG_SETTING.LOGGING;
                        }
                        service.enabled = logging;

                        deferred.resolve();
                    })
                    .catch(function (error) {
                        deferred.reject(error);
                    });

                return deferred.promise;
            };

            /**
             * Set logging related info for caching with logToFile.headerInfo.
             *
             * @returns {*|promise}
             */
            var setLoggingRelatedInfo = function () {
                var deferred = $injector.get('$q').defer();

                service.logToFile.headerInfo = '';

                var $cordovaAppVersion = $injector.get('$cordovaAppVersion');

                $cordovaAppVersion.getAppName()
                    .then(function (appName) {

                        service.logToFile.headerInfo += 'App name: ' + appName + '\n';

                        var currentUser = $injector.get('LocalCacheService').get('currentUser');
                        if (currentUser) {
                            service.logToFile.headerInfo += 'Username: ' + currentUser.Username + '\n';
                        }

                        service.logToFile.headerInfo += 'Manufacturer: ' + device.manufacturer + '\n';
                        service.logToFile.headerInfo += 'Model name: ' + device.model + '\n';
                        service.logToFile.headerInfo += 'Operating system: ' + device.platform + '\n';
                        service.logToFile.headerInfo += 'Operating system version: ' + device.version + '\n';

                        return $cordovaAppVersion.getPackageName();
                    })
                    .then(function (appPackage) {
                        service.logToFile.headerInfo += 'App package: ' + appPackage + '\n';

                        return $cordovaAppVersion.getVersionNumber();
                    })
                    .then(function (appVersion) {
                        service.logToFile.headerInfo += 'App version: ' + appVersion + '\n';

                        deferred.resolve();
                    })
                    .catch(function (error) {
                        deferred.reject(error);
                    });

                return deferred.promise;
            };

            /**
             * Change logging setting for enable or disable logging feature.
             *
             * @param enabledLog
             *
             * @returns {*|promise}
             */
            service.changeLoggingSetting = function (enabledLog) {
                var deferred = $injector.get('$q').defer();

                service.enabled = enabledLog;

                $injector.get('MetaService').setMetaValue('logging', enabledLog).then(function () {

                    return $injector.get('FileService').initializeLogFolder();
                }).then(function () {
                    deferred.resolve();
                }).catch(function (error) {
                    deferred.reject(error);
                });

                return deferred.promise;
            };

            /**
             * open error alert
             * TODO This method should be moved
             * TODO Need some way to configure what happens after user clicked the message - e.g. passing a callback
             * TODO Error messages should be written for USERS not for DEVELOPERS. This has to be changed everywhere
             * TODO Triggered by $log.error. Modify calls to send only the error object instead of text + JSON - everywhere
             * @param {object} exception
             */
            service.showError = function (exception) {
                var $state = $injector.get('$state');
                var IonicLoadingService = $injector.get('IonicLoadingService');
                var $ionicPopup = $injector.get('$ionicPopup');
                var $window = $injector.get('$window');
                var APP_SETTINGS = $injector.get('APP_SETTINGS');

                IonicLoadingService.hide();

                $window.plugins.toast.showWithOptions({
                    message: service.getErrorMessage(exception),
                    duration: 2500,
                    position: 'bottom',
                    styling: {
                        opacity: 1.0, // 0.0 (transparent) to 1.0 (opaque). Default 0.8
                        backgroundColor: '#54698d', // make sure you use #RRGGBB. Default #333333
                        textColor: '#FFFFFF', // Ditto. Default #FFFFFF
                        textSize: 13, // Default is approx. 13.
                        cornerRadius: 4, // minimum is 0 (square). iOS default 20, Android default 100
                        horizontalPadding: 24, // iOS default 16, Android default 50
                        verticalPadding: 12 // iOS default 12, Android default 30
                    }
                });

                $state.go(APP_SETTINGS.START_VIEW);
            };

            /**
             * Returns error message based on error.status
             * Could be extended to check other attributes of error objects for returning a meaningful error message
             * for the user.
             * TODO Check for way to have the texts easier maintainable. Yet it is not the best idea to put them into locales, because they will not be reliably loaded in case of startup problems
             * TODO This is not logging and should be moved
             * @param exception
             * @returns {string}
             */
            service.getErrorMessage = function (exception) {

                var message = '';

                switch (exception.status) {
                    case 400:
                        message = 'Received data does not match the expected format. Please contact your administrator.';
                        break;

                    case 401:
                        message = 'You are not authorized to access data. Please contact your administrator.';
                        break;

                    case 403:
                        message = 'Access to data forbidden. Please contact your administrator.';
                        break;

                    case 404:
                        message = 'Could not access data. Please check your internet connection.';
                        break;

                    case 405:
                        message = 'Using a non allowed method to access data. Please contact your administrator.';
                        break;

                    case 407:
                        message = 'Proxy authentication required. Please contact your administrator.';
                        break;

                    case 408:
                        message = 'Timeout received. Please check your internet connection.';
                        break;

                    case 415:
                        message = 'Returned media type is not supported by this app. Please contact your administrator.';
                        break;

                    case 500:
                        message = 'Remote endpoint reported an internal error. Please contact your administrator.';
                        break;

                    case 503:
                        message = 'Remote endpoint is not available. Please contact your administrator.';
                        break;

                    default:
                        message = 'Unexpected error. Please contact your administrator. Details: ' + exception.name + ': ' + exception.message;
                        break;
                }

                return message;

            };

            /**
             * log function
             */
            var log = function (params) {

                if (service.enabled === true) {

                    angular.forEach(params.exceptions, function (exception) {

                        if (typeof exception === 'object') {
                            logObject(exception, params);
                        }
                        else {
                            logString(exception, params);
                        }
                    });
                }
            };

            /**
             * log exception object
             * @param {object} exception
             * @param {object} params
             */
            function logObject(exception, params) {
                var log = '[' + params.type + '] - ' + exception.name + ' - ' + exception.message + '\n' +
                    exception.sourceURL + ' line: ' + exception.line + ' column: ' + exception.column;

                // Especially show log info for our custom "Exception",
                // including severity, code, action time, and the more exactly source url
                if (typeof exception.handle === 'function' || exception.severity) {
                    var msg = exception.message;
                    var rawEx = exception.rawException;

                    if (!msg && rawEx) {
                        msg = rawEx['responseJSON'] && rawEx['responseJSON'][0]['message'] ? rawEx['responseJSON'][0]['message'] : service.getErrorMessage(rawEx);
                    }

                    if (rawEx && typeof rawEx === 'string') {
                        msg += ' (' + rawEx + ')';
                    }

                    log = '[' + params.type + '] - [severity: ' + exception.severity + ', code: ' + exception.code +
                        ', action time: ' + $filter('date')(exception.localTime, 'HH:mm:ss.sss') + '] - ' + msg + '\n';

                    // Fetch more exactly source url, line and column from stack,
                    // which exclude the default first CommonError in our custom "Exception".
                    var stackStr = '' + exception.stack;
                    var pattern = new RegExp('(.*js):([1-9]\\d*):([1-9]\\d*)', 'g');
                    var ret, sourceURL;
                    while ((ret = pattern.exec(stackStr)) != null) {

                        if (ret[0].indexOf('CommonError') === -1 && (sourceURL = ret[0].match('\\w+:.*.js')) !== null) {
                            log += sourceURL + ' line: ' + ret[2] + ' column: ' + ret[3];
                            break;
                        }
                    }
                }

                if (exception.cause) {
                    log = log + '\ncause: \n' + exception.cause;
                }

                if (params.includeStack === true) {
                    log = log + '\nStacktrace: \n' + exception.stack;
                }

                if (service.logToConsole === true) {
                    void 0;
                }

                if (params.logToFile === true) {
                    //TODO: split file size, zip and prepare for upload to salesforce
                    writeLog(log);
                }

                if (params.type === 'error' && params.showAlert === true && !exception.severity) {
                    service.showError(exception);
                }

                if (service.logToSoup) {
                    logToSoup();
                }
            }

            /**
             * log string
             * @param {string} exception
             * @param {object} params
             */
            function logString(exception, params) {
                var log = '[' + params.type + '] - ' + exception;

                if (service.logToConsole === true) {
                    void 0;
                }

                if (params.logToFile === true) {
                    //TODO: split file size, zip and prepare for upload to salesforce
                    writeLog(log);
                }

                if (params.type === 'error' && params.showAlert === true) {
                    service.showError({title: null, message: exception});
                }
            }

            /**
             * log to soup for synchronization
             */
            function logToSoup() {
                // TODO: log to _logging soup to synchronize to salesforce
            }

            /**
             * write log to file
             * @param {string} log
             */
            function writeLog(log) {
                var FileService = $injector.get('FileService');

                // TODO: log current device used memory at the time
                log = '\n' + $filter('date')(new Date(), 'yyyy-MM-dd HH:mm:ss Z') + ' - ' + log;

                FileService.writeLogDataByBuffer(log);
            }

            return service;
        });
})(angular);

(function () {

    'use strict';

    angular.module('oinio.core.modal')
        .controller('SaveModalController', function ($scope, parameters) {
            var vm = this;

            vm.sobject = parameters.sobject;
            vm.layout = parameters.layout;
            vm.readOnlyFields = parameters.readOnlyFields;

            /**
             * take over new or edited values from form into sobject
             * @param {object} pageLayoutForm
             */
            vm.save = function (pageLayoutForm) {
                for (var prop in pageLayoutForm) {
                    // we do only need the fields, not the standard properties of the formcontroller
                    if (prop.indexOf('$') !== 0) {
                        var current = pageLayoutForm[prop];

                        if (!current.$pristine && current.$valid && prop in vm.sobject) {
                            vm.sobject[prop] = current.$modelValue;
                        } else if (!current.$pristine && current.$valid && prop.indexOf('.') !== -1) { // if we have a dot in prop we have to fill a sub-object
                            var splitted = prop.split('.');
                            vm.sobject[splitted[0]][1] = current.$modelValue;
                        }
                    }
                }

                $scope.closeModal(true);
            };

            /**
             * cancel editing - just close the modal
             */
            vm.cancel = function () {
                $scope.closeModal(false);
            };
        });
})();

(function () {
    'use strict';

    angular.module('oinio.core.modal')
        .service('ModalService', function ($ionicModal, $rootScope, $q, $injector, $controller) {

            this.show = function (templeteUrl, controller, parameters, options) {
                // Grab the injector and create a new scope
                var deferred = $q.defer(),
                    ctrlInstance,
                    modalScope = $rootScope.$new(),
                    thisScopeId = modalScope.$id,
                    defaultOptions = {
                        animation: 'slide-in-up',
                        focusFirstInput: false,
                        backdropClickToClose: false,
                        hardwareBackButtonClose: false,
                        modalCallback: null
                    };

                options = angular.extend({}, defaultOptions, options);

                $ionicModal.fromTemplateUrl(templeteUrl, {
                    scope: modalScope,
                    animation: options.animation,
                    focusFirstInput: options.focusFirstInput,
                    backdropClickToClose: options.backdropClickToClose,
                    hardwareBackButtonClose: options.hardwareBackButtonClose
                }).then(function (modal) {
                    modalScope.modal = modal;

                    modalScope.openModal = function () {
                        modalScope.modal.show();
                    };
                    modalScope.closeModal = function (result) {
                        deferred.resolve(result);
                        modalScope.modal.hide();
                    };
                    modalScope.$on('modal.hidden', function (thisModal) {
                        if (thisModal.currentScope) {
                            var modalScopeId = thisModal.currentScope.$id;
                            if (thisScopeId === modalScopeId) {
                                deferred.resolve(null);
                                _cleanup(thisModal.currentScope);
                            }
                        }
                    });

                    // Invoke the controller
                    var locals = {'$scope': modalScope, 'parameters': parameters};
                    var ctrlEval = _evalController(controller);
                    ctrlInstance = $controller(controller, locals);
                    if (ctrlEval.isControllerAs) {
                        ctrlInstance.openModal = modalScope.openModal;
                        ctrlInstance.closeModal = modalScope.closeModal;
                    }

                    modalScope.modal.show()
                        .then(function () {
                            modalScope.$broadcast('modal.afterShow', modalScope.modal);
                        });

                    if (angular.isFunction(options.modalCallback)) {
                        options.modalCallback(modal);
                    }

                }, function (err) {
                    deferred.reject(err);
                });

                return deferred.promise;
            };

            function _cleanup(scope) {
                scope.$destroy();
                if (scope.modal) {
                    scope.modal.remove();
                }
            }

            function _evalController(ctrlName) {
                var result = {
                    isControllerAs: false,
                    controllerName: '',
                    propName: ''
                };
                var fragments = (ctrlName || '').trim().split(/\s+/);
                result.isControllerAs = fragments.length === 3 && (fragments[1] || '').toLowerCase() === 'as';
                if (result.isControllerAs) {
                    result.controllerName = fragments[0];
                    result.propName = fragments[2];
                } else {
                    result.controllerName = ctrlName;
                }

                return result;
            }
        });
})();

(function () {

    'use strict';

    angular
        .module('oinio.core.modal')
        .service('SimpleModalService', SimpleModalService);

    function SimpleModalService($ionicModal, $rootScope) {

        var init = function (tpl, $scope, sAnimate) {

            var promise;
            $scope = $scope || $rootScope.$new();

            promise = $ionicModal.fromTemplateUrl(tpl, {
                scope: $scope,
                animation: sAnimate
            }).then(function (modal) {
                $scope.modal = modal;
                return modal;
            });

            $scope.openModal = function () {
                $scope.modal.show();
            };
            $scope.closeModal = function () {
                //$scope.modal.hide();
                $scope.modal.remove();
            };
            $scope.$on('$destroy', function () {
                $scope.modal.remove();
            });

            return promise;
        };

        return {
            init: init
        };
    }
})();
/*
(function (angular) {

    'use strict';

    angular.module('oinio.core.detail')
        .controller('ObjectDetailController', function ($scope, $stateParams, PageLayoutService) {

            var vm = this;
            vm.mode = 'view';
            vm.objectType = $stateParams.objectType;
            var sid = $stateParams.sid;
            var isEdit = false;

            /!**
             * @type {Array}
             *!/
            vm.layout = {};
            vm.sobject = {};

            /!**
             * init detail view
             *!/
            $scope.$on('$ionicView.enter', function () {
                PageLayoutService.generatePageLayout(vm.objectType, sid, isEdit).then(function (resolve) {
                    vm.layout = resolve.layout;
                    vm.sobject = resolve.sobject;
                }, function (error) {
                    console.log('Error in ObjectDetailController $ionicView.enter' + error);
                });
            });
        });

})(angular);
*/

(function (angular) {

    'use strict';

    angular.module('oinio.core.detail')
        .controller('ObjectDetailTabController', function ($scope, $injector, $stateParams, PageLayoutService) {

            var vm = this;
            vm.mode = 'view';
            vm.objectType = $stateParams.objectType;
            vm.sid = $stateParams.sid; // TODO: HACKY. Only for showcase! Change it after it happened
            var sid = $stateParams.sid;
            var isEdit = false;

            /**
             * @type {Array}
             */
            vm.layout = {};
            vm.sobject = {};

            /**
             * init detail view
             */
            vm.getPageLayout = function () {
                /*var objectDetailService = $injector.get('ObjectDetailService');

                 var pageLayoutResult = objectDetailService.getPageLayoutResult();
                 vm.layout = pageLayoutResult.layout;
                 vm.sobject = pageLayoutResult.sobject;*/

                PageLayoutService.generatePageLayout(vm.objectType, sid, isEdit).then(function (resolve) {
                    vm.layout = resolve.layout;
                    vm.sobject = resolve.sobject;
                }, function (error) {
                    void 0;
                });
            };


            vm.getRelatedLists = function () {

                var relatedListService = $injector.get('RelatedListService');

                PageLayoutService.generatePageLayout(vm.objectType, sid, isEdit).then(function (resolve) {
                    vm.sobject = resolve.sobject;
                    vm.labelName = vm.sobject.Name;
                }, function (error) {
                    void 0;
                });

                relatedListService.getAllRelatedListsByObjectType(vm.objectType)
                    .then(function (relatedLists) {
                        vm.relatedLists = relatedLists
                    })
                    .catch(function (error) {
                        void 0;
                    });
            };

            /**
             * Helper method to convert resultList into JSON stringified representation
             * TODO: Just hack to cheat. Remove this after showcasing and do it right.
             * @param resultList
             */
            vm.getStringifiedResultList = function (resultList) {
                return JSON.stringify(resultList);
            };

            vm.relatedLists = [];
        });

})(angular);

(function (angular) {

    'use strict';

    angular.module('oinio.core.detail')
        .controller('ObjectRelatedListController', function ($scope, $injector, $stateParams, PageLayoutService) {

            var vm = this;
            vm.mode = 'view';
            vm.relatedList = JSON.parse($stateParams.relatedList);
            vm.objectType = $stateParams.objectType;
            vm.pageSize = $stateParams.pageSize;
            vm.page = $stateParams.page;
            vm.sid = $stateParams.sid;
            vm.labelName = $stateParams.labelName;
            var isEdit = false;

            /**
             * @type {Array}
             */
            vm.layout = {};
            vm.sobject = {};

            /**
             * init detail view
             */
            vm.getRecordsForRelatedList = function () {
                var relatedListService = $injector.get('RelatedListService');

                relatedListService.getPageableRelatedRecordsForRelatedList(vm.relatedList, vm.sid, vm.objectType, vm.pageSize, vm.page)
                    .then(function (records) {
                        vm.records = records
                    })
                    .catch(function (error) {
                        void 0;
                    })
            };

            /**
             * getName method returns the Name of the objectType except for Case, where Subject is returned.
             */
            vm.getName = function (record) {
                if(record)
                {
                    if(vm.relatedList.sobject === 'Case') {
                        return record.Subject;
                    }
                    else
                    {
                        return record.Name;
                    }
                }
            }


            vm.records = [];
        });

})(angular);

(function (angular) {

    'use strict';

    angular.module('oinio.core.detail')
        .controller('ObjectTabsController', function ($q, $scope, $stateParams, $ionicScrollDelegate, PageLayoutService) {

            var vm = this;

            vm.mode = 'view';
            vm.objectType = $stateParams.objectType;
            vm.sid = $stateParams.sid;
            vm.sobject = null;
            vm.layout = null;

            vm.initTabCtrl = false;
            vm.scroll = true;


            // ToDo: What is this???
            //vm.tester = LocalDataService.queryConfiguredObjectByName('Account');

            /**
             * @function    reportSlideChanged
             * @description
             *
             * @param {number} index
             */
            $scope.reportSlideChanged = function (index) {
                switch (index) {
                    case 0:
                        vm.isDetailTab = true;
                        break;
                    case 1:
                        vm.isRelatedListTab = true;
                        break;
                }
            };

            /**
             * @description initialize functions on view enter.
             */
            $scope.$on('$ionicView.beforeEnter', function () {
                PageLayoutService.generatePageLayout(vm.objectType, vm.sid, false).then(function (resolve) {
                    vm.layout = resolve.layout;
                    vm.sobject = resolve.sobject;
                    vm.initTabCtrl = true;
                }, function (error) {
                    void 0;
                });
            });
        });

})(angular);

(function () {

    'use strict';

    angular.module('oinio.core.detail')
        .service('ObjectDetailService', function ($q, $log, $injector) {

            /**
             * @typedef pageLayoutResult
             * @type {object}
             * @property {object} sobject the generated sobject
             * @property {layout} layout the generated layout
             */
            var pageLayoutResult = null;

            /**
             * get the complete pageLayoutResult
             * @returns {pageLayoutResult}
             */
            this.getPageLayoutResult = function () {
                return pageLayoutResult;
            };

            /**
             * get currently loaded layout
             * @returns {*}
             */
            this.getLayout = function () {
                return pageLayoutResult.layout;
            };

            /**
             * get currently loaded sobject
             * @returns {*}
             */
            this.getSObject = function () {
                return pageLayoutResult.sobject;
            };

            /**
             * load sobject and describe layout for given object type and sid
             *
             * @param {string} objectType
             * @param {number} sid
             * @retuns {pageLayoutResult}
             */
            this.loadSObjectForLayout = function (objectType, sid) {
                var deferred = $q.defer();

                var pageLayoutService = $injector.get('PageLayoutService');

                pageLayoutService.generatePageLayout(objectType, sid, false).then(function (layoutResult) {
                    pageLayoutResult = {sobject: layoutResult.sobject, layout: layoutResult.layout};
                    deferred.resolve(pageLayoutResult);
                }, function (error) {
                    $log.error('>>>> Error in ObjectDetailService loadSObjectForLayout(): ' + error);
                    deferred.reject('error during generating pagelayout');
                });

                return deferred.promise;
            };
        });
})();

(function (angular) {

    'use strict';

    angular.module('oinio.core.object-home')
        .controller('ObjectHomeController', function ($scope, $filter, $stateParams, $ionicNavBarDelegate,
                                                      LocalDataService, PageLayoutService, ModalService,
                                                      IonicLoadingService, LocalSyncService,
                                                      ConnectionMonitor) {
            var vm = this;
            var pageSize = 20;

            vm.objectType = $stateParams.objectType;
            vm.objectLabel = $filter('translate')(vm.objectType + '.labelPlural');
            vm.searchTerm = $stateParams.searchTerm;

            $scope.$on('$ionicView.afterEnter', function (viewInfo, state) {

                setTimeout(function () {
                    $ionicNavBarDelegate.align('left');
                }, 10);
            });

            $scope.$on('$ionicView.beforeEnter', function (viewInfo, state) {


                LocalDataService.getObjectStylesByName([vm.objectType]).then(function(objectTypes) {
                    vm.iconClassName = objectTypes[vm.objectType]['class'];
                    vm.iconClassPath = objectTypes[vm.objectType]['icon'];
                });


                if (vm.searchTerm && vm.searchTerm.trim().length >= 3) {
                    vm.search(vm.searchTerm);
                } else {
                    LocalDataService.globalSearch(vm.objectType, null, 5, 'LastViewedDate', 'DESC').then(function (resolve) {
                        searchResults = resolve;
                        vm.showingRecords = searchResults.slice(0, pageSize);
                    });
                }
            });

            /**
             *
             * @type {Array}
             */
            var searchResults = [];

            /**
             *
             * @type {Array}
             */
            vm.showingRecords = [];

            /**
             * process search
             * @param searchTerm
             */
            vm.search = function (searchTerm) {
                vm.message = null;
                if (searchTerm && searchTerm.trim().length < 3) {
                    vm.message = $filter('translate')('cl.global.msg_searchTermLengthRequired');
                } else {
                    LocalDataService.globalSearch(vm.objectType, searchTerm).then(function (resolve) {
                        searchResults = resolve;
                        vm.showingRecords = searchResults.slice(0, pageSize);
                        if (!resolve || !resolve.length) {
                            vm.message = $filter('translate')('cl.global.msg_searchWithNoResults').trim() + ' \'' + searchTerm + '\'';
                        }
                    });
                }
            };

            /**
             * load more records
             */
            vm.loadMore = function () {
                vm.showingRecords = vm.showingRecords.concat(searchResults.slice(vm.showingRecords.length, vm.showingRecords.length + pageSize));
                $scope.$broadcast('scroll.infiniteScrollComplete');
            };

            /**
             * check if more records are available
             * @returns {boolean}
             */
            vm.moreDataCanBeLoaded = function () {
                return vm.showingRecords.length < searchResults.length;
            };

            $scope.$on('$stateChangeSuccess', function () {
                vm.loadMore();
            });

            /**
             * create new SObject
             */
            vm.createSObject = function () {

                LocalDataService.createSObject(vm.objectType, null).then(function (sobj) {

                    vm.newSObject = sobj;

                    PageLayoutService.generatePageLayoutForSObject(vm.newSObject, true).then(function (pagelayoutResult) {

                        ModalService.show('app/core/modal/templates/edit.record.modal.view.html', 'SaveModalController as vm', {
                            layout: pagelayoutResult.layout,
                            sobject: vm.newSObject
                        }, {
                            animation: 'slide-in-up',
                            focusFirstInput: false,
                            backdropClickToClose: false,
                            hardwareBackButtonClose: false
                        }).then(function (save) {

                            if (save === true) {
                                IonicLoadingService.show($filter('translate')('cl.sync.lb_saving'));

                                LocalDataService.saveSObjects(vm.newSObject.attributes.type, [vm.newSObject]).then(function (saveSuccess) {

                                    if (saveSuccess[0]['success']) {
                                        vm.newSObject['_soupEntryId'] = saveSuccess[0]['_soupEntryId'];
                                        IonicLoadingService.hide();
                                        vm.synchronize(vm.newSObject.attributes.type);
                                    }
                                }, function (error) {
                                    $log.error('>>>> Error in AccountDetailController while saving an record in editDetails(): ' + error);
                                });
                            }
                        }, function (error) {
                            $log.error('>>>> Error in AccountDetailController - editDetails(): ' + error);
                        });
                    }, function (error) {
                        $log.error('>>>> Error in AccountDetailController - editDetails(): ' + error);
                    });

                }, function (error) {
                    // log error
                    $log.error(error);
                });
            };

            /**
             * synchronize to salesforce if device is online
             */
            vm.synchronize = function (objectType) {
                if (ConnectionMonitor.isOnline()) {
                    IonicLoadingService.show($filter('translate')('cl.sync.lb_syncing'));
                    LocalSyncService.syncUpObjectByName(objectType).then(function () {

                        // reload saved sobject
                        LocalDataService.getSObject(vm.newSObject.attributes.type, vm.newSObject._soupEntryId).then(function (reloadedSObject) {
                            vm.newSObject = reloadedSObject;
                            IonicLoadingService.hide();
                        });
                    });
                }
                else {
                    // reload saved sobject
                    LocalDataService.getSObject(vm.newSObject.attributes.type, vm.newSObject._soupEntryId).then(function (reloadedSObject) {
                        vm.newSObject = reloadedSObject;
                    });
                }
            };

            /**
             * getName method returns the Name of the objectType except for Case, where Subject is returned.
             */
            vm.getName = function (item) {
                if(item)
                {
                    if(vm.objectType === 'Case') {
                        return item.Subject;
                    }
                    else
                    {
                        return item.Name;
                    }
                }
            }

        });
})(angular);

(function (angular) {

    'use strict';

    angular.module('oinio.core.object-home')
        .directive('searchBox', function () {

            return {
                restrict: 'E',
                replace: true,
                /*
                 "@"   ( Text binding / one-way binding )
                 "="   ( Direct model binding / two-way binding )
                 "&"   ( Behaviour binding / Method binding  )
                 */
                scope: {
                    doSearch: '&submit',
                    searchTerm: '=?ngModel'
                },

                link: function (scope, element, attrs) {

                },

                template: '<form class="searchBox" ng-submit="doSearch({searchTerm: searchTerm});">' +
                '<div class="slds-form-element__control slds-input-has-icon slds-input-has-icon--right">' +
                '<svg aria-hidden="true" class="slds-input__icon slds-icon-text-default">' +
                '<use ng-show="!searchTerm" ' +
                'xlink:href="lib/salesforce-lightning-design-system/assets/icons/utility-sprite/svg/symbols.svg#search"></use>' +
                '<use ng-show="searchTerm" ' +
                'xlink:href="lib/salesforce-lightning-design-system/assets/icons/utility-sprite/svg/symbols.svg#close" ' +
                'ng-click="searchTerm = null;"></use>' +
                '</svg>' +
                '<input style="height: 28px;display: inline-block;min-height: initial; margin-bottom: 4px;"' +
                ' class="slds-input" type="text" aria-haspopup="true" aria-autocomplete="list" role="combobox" aria-activedescendant="" ng-model="searchTerm"/>' +
                '</div></form>'
            };
        });
})(angular);

(function () {

    'use strict';

    angular
        .module('oinio.core.pageLayoutRenderer')
        .directive('staticIncludeWithoutNewScope', StaticIncludeWithoutNewScope);

    /**
     * @desc A Directive to integrate a template without a new scope to create. This only returns the Template Path.
     *
     * @func StaticIncludeWithoutNewScope
     * @constructor
     */
    function StaticIncludeWithoutNewScope() {

        return {
            restrict: 'AE',
            templateUrl: function(ele, attrs) {
                return attrs.templatePath;
            }
        };
    }
})();

'use strict';

angular.module('oinio.core.pageLayoutRenderer')
    .component('layoutComponents', {
        templateUrl: 'app/core/pagelayout/layoutcomponents/layoutcomponents.component.html',
        bindings: {
            layoutcomponents: '<',
            editableForUpdate: '<',
            required: '<',
            rendermode: '<',
            sobject: '<',
            readOnlyFields: '<'
        },
        controller: function(localizeService){
            this.$onInit = function (changesObj) {
                void 0;
            };
            /**
             * get formatted string
             * @param value
             * @param type
             * @returns {*}
             */
            this.getFormattedString = function(value, type){
                return localizeService.getFormattedString(value, type);
            };


            this.getObjectURL = function(relationshipName){
                return localizeService.getObjectURL(this.sobject, relationshipName);
            };

            /**
             * get label for lookup
             * @param relationshipName
             * @param objectType
             * @returns {*}
             */
            this.getReferenceLabel = function(relationshipName, objectType){
                return localizeService.getReferenceLabel(this.sobject, relationshipName, objectType);
            };

            /**
             * get picklist label for picklist value
             * @param picklist
             * @param values
             * @returns {string}
             */
            this.getPicklistLabel = function(picklist, values){
              return localizeService.getPicklistLabel(this.sobject, picklist, values);
            };

            /**
             * @description get picklist labels for multiPicklist values
             * @param picklist
             * @param values
             * @returns {string}
             */
            this.getMultiPicklistLabel = function (picklist, values) {
                return localizeService.getMultiPicklistLabel(this.sobject, picklist, values)
            };
        },
        transclude: 'true',
        controllerAs: '$ctrl'
    });
'use strict';

angular.module('oinio.core.pageLayoutRenderer')
    .component('layoutHeader', {
        templateUrl: 'app/core/pagelayout/layoutheader/layoutheader.component.html',
        bindings: {
            sobject: '<',
            showHeader: '<',
            headerHighlightFields: '<'
        },
        controller: function ($filter) {
            this.getName = function () {
                if (!this.sobject) {
                    return;
                }
                var nameField;
                // salesforce specials for objects with no name fields
                void 0;
                switch (this.sobject.attributes.type){
                    case 'Case' :
                    case 'Task' :
                    case 'Event' :
                    case 'Attachment' :
                    case 'Case' :
                        nameField = 'Subject';
                        break;
                    default:
                        nameField = 'Name';
                }
                // return the name
                return this.sobject[nameField];
            };
            this.getFormattedHeader = function () {
                if (this.sobject) {
                    return $filter('addressFormatter')(this.sobject.BillingAddress);
                }
            };
        },
        transclude: 'true',
        controllerAs: '$ctrl'
    }
    );

'use strict';

angular.module('oinio.core.pageLayoutRenderer')
    .component('layoutSections', {
        templateUrl: 'app/core/pagelayout/layoutsections/layoutsections.component.html',
        bindings: {
            rendermode: '<',
            sobject: '<',
            layoutsections: '<',
            expandSection: '&',
            collapseSections: '<',
            readOnlyFields: '<'
        },
        transclude: 'true',
        controllerAs: '$ctrl',
        controller: function ($ionicScrollDelegate, customScrollDelegateService) {
            this.created    = [0];
            this.expanded   = [0];

            this.$onInit = function (initObject) {
                void 0;

                /**
                 * @func    setFirstToggled
                 *
                 * @desc    Here the toggled the first section of the initial set to true so that the correct CSS classes
                 *          in the first section are correctly set.
                 * @param   section
                 * @param   isFirst
                 *
                 * @return {boolean}
                 */
                this.setFirstToggled = function (section, isFirst) {
                    if (isFirst) {
                        this.toggleSection(section);
                    }
                };
            };

            this.$onChanges = function (changesObject) {
                void 0;
            };

            /**
             * @func    expandSection
             *
             * @desc    expand Section by index
             * @param   index
             */
            this.expandSection = function (index) {
                if (this.created.indexOf(index) === -1) {
                    this.created.push(index);
                }
                if (this.expanded.indexOf(index) === -1) {
                    this.expanded.push(index);
                }
                else {
                    this.expanded.splice(this.expanded.indexOf(index), 1);
                }

                /**
                 * @desc For each opening and closing is the size of the container is re-calculated.
                 */
                if (this.rendermode === 'view') {
                    $ionicScrollDelegate.$getByHandle('pageLayoutViewMode').resize();
                } else if (this.rendermode === 'edit') {
                    customScrollDelegateService.$getByHandle('pageLayoutEditMode').resize();
                }
            };

            /**
             * @description toggle class for icon transformation "o-toggle-icon-pagelayout-section"
             * @param section
             */
            this.toggleSection = function (section) {
                section.toggled = !section.toggled;
            };
        }
    });
'use strict';

angular.module('oinio.core.pageLayoutRenderer')
    .component('addressComponent', {
        templateUrl: 'app/core/pagelayout/layoutitems/address.component/address.component.html',
        require: {
            form: '^form'
        },
        bindings: {
            sobject: '<',
            components: '<',
            required: '<',
            placeholder: '<',
            tabOrder: '<',
            editableForUpdate: '<',
            detail: '<'
        },
        controller: function () {
            this.$onInit = function () {
                void 0;
            };
            this.changeHandler = function (fieldName) {
                var addressFieldName = this.getAddressFieldFromFieldName(fieldName);
                this.form[this.detail.name + '.' + addressFieldName].$setViewValue(this.form[fieldName].$modelValue);
                void 0;
            };
            this.getAddressFieldFromFieldName = function (fieldName) {
                var fn = fieldName.toLowerCase();
                //var returnString = this.detail.name + '.';
                if (fn.indexOf('street') > -1) {
                    return 'street';
                } else if (fn.indexOf('city') > -1) {
                    return 'city';
                } else if (fn.indexOf('country') > -1) {
                    return 'country';
                } else if (fn.indexOf('postalcode') > -1) {
                    return 'postalCode';
                } else if (fn.indexOf('state') > -1) {
                    return 'state';
                } else if (fn.indexOf('latitude') > -1) {
                    return 'latitude';
                } else if (fn.indexOf('longitude') > -1) {
                    return 'longitude';
                }
            };
        },
        transclude: 'true',
        controllerAs: '$ctrl'
    });

'use strict';

angular.module('oinio.core.pageLayoutRenderer')
    .component('booleanComponent', {
        templateUrl: 'app/core/pagelayout/layoutitems/boolean.component/boolean.component.html',
        require: {
            form: '^form'
        },
        bindings: {
            value: '<',
            detail: '<',
            required: '<',
            tabOrder: '<',
            editableForUpdate: '<',
            readOnlyFields: '<',
            onChange: '&'
        },
        controller: function () {

            this.itemEditableForUpdate = false;

            /**
             * @func itemIsEditableForUpdate
             * @desc Checks whether the respective item is editable.
             */
            this.itemIsEditableForUpdate = function () {
                if (this.readOnlyFields && this.readOnlyFields.indexOf(this.detail.name) !== -1) {
                    return false;
                } else {
                    return this.editableForUpdate;
                }
            };

            this.$onInit = function () {
                void 0;
                this.itemEditableForUpdate = this.itemIsEditableForUpdate();
            };
            this.change = function () {
                if (this.onChange) {
                    this.onChange({fieldName: this.detail.name});
                }
            };
        },
        transclude: 'true',
        controllerAs: '$ctrl'
    });

'use strict';

angular.module('oinio.core.pageLayoutRenderer')
    .component('contactNameComponent', {
        templateUrl: 'app/core/pagelayout/layoutitems/contact.name.component/contact.name.component.html',
        require: {
            form: '^form'
        },
        bindings: {
            sobject: '<',
            detail: '<',
            components: '<',
            required: '<',
            placeholder: '<',
            tabOrder: '<',
            editableForUpdate: '<'
        },
        controller: function () {
            this.$onInit = function () {
                void 0;
            };

            this.changeHandler = function (fieldName) {
                var nameString = '';
                if ('FirstName' in this.form && this.form['FirstName'].$modelValue && this.form['FirstName'].$modelValue !== '') {
                    nameString += this.form['FirstName'].$modelValue + ' ';
                }
                this.form['Name'].$setViewValue(nameString + this.form['LastName'].$modelValue);
            };
        },
        transclude: 'true',
        controllerAs: '$ctrl'
    });

(function (angular, moment) {

    'use strict';

    angular.module('oinio.core.pageLayoutRenderer')
        .component('dateComponent', {
            templateUrl: 'app/core/pagelayout/layoutitems/date.component/date.component.html',
            require: {
                form: '^form'
            },
            bindings: {
                value: '<',
                detail: '<',
                required: '<',
                tabOrder: '<',
                editableForUpdate: '<'
            },
            controller: function ($filter, $timeout, LocalCacheService, localizeService) {

                var currentUser = LocalCacheService.get('currentUser'),
                    tabOrder    = this.tabOrder;

                this.selectedTime = null;
                this.sfdcDate = null;

                this.itemEditableForUpdate = false;

                this.setDate = function () {
                    var lt = this.selectedTime;

                    if (lt && currentUser) {

                        if (this.detail.type === 'date') {
                            // set current time in sfTime. Problem is, sfTime hat time 00:00:00 and if we than set the UTC time is it is possible that the wrong date is saves
                            // sfTime = 2016-07-22 00:00:00 => utc offset is then in case of e.g. GMT +2 2016-07-21 22:00:00 ==> so the wrong date is used
                            var currentTime = new Date();
                            lt.setHours(currentTime.getHours());
                            lt.setMinutes(currentTime.getMinutes());
                            lt.setSeconds(currentTime.getSeconds());
                        }

                        // convert local time to salesforce time
                        var sfTime = moment().tz(currentUser['TimeZoneSidKey'])
                            .year(lt.getFullYear()).month(lt.getMonth()).date(lt.getDate())
                            .hour(lt.getHours()).minute(lt.getMinutes()).second(lt.getSeconds()).millisecond(lt.getMilliseconds());

                        if (this.detail.type === 'datetime') {
                            this.value = sfTime.utcOffset(0).format('YYYY-MM-DDTHH:mm:ss.SSSZZ');
                            this.sfdcDate = sfTime.toISOString();
                        } else {
                            this.value = sfTime.utcOffset(0).format('YYYY-MM-DD');
                            this.sfdcDate = this.value;
                        }

                        // set value in form
                        this.form[this.detail.name].$setViewValue(this.sfdcDate);
                        // set value fake formatedDate input in form
                        this.formatedDate = localizeService.getFormattedString(this.sfdcDate, this.detail.type);
                    }
                    else if (!lt) {
                        this.sfdcDate = null;
                        this.formatedDate = null;
                    }

                    this.form[this.detail.name].$setTouched();
                };

                /**
                 * @func itemIsEditableForUpdate
                 * @desc Checks whether the respective item is editable.
                 */
                this.itemIsEditableForUpdate = function () {
                    if (this.readOnlyFields && this.readOnlyFields.indexOf(this.detail.name) !== -1) {
                        return false;
                    } else {
                        return this.editableForUpdate;
                    }
                };

                this.$onInit = function () {
                    void 0;
                    this.itemEditableForUpdate = this.itemIsEditableForUpdate();
                    if (this.value && currentUser) {

                        var timezone = currentUser['TimeZoneSidKey'];
                        // convert datetime string with salesforce user timezone
                        var sfTime = moment.tz(this.value, timezone);

                        // prepare date for display with local html5 input type date|datetime
                        this.selectedTime = new Date(sfTime.year(), sfTime.month(), sfTime.date(), sfTime.hour(), sfTime.minute(), sfTime.second(), sfTime.millisecond());

                        // set value initialize in sfdcDate for Validation
                        this.sfdcDate = this.value;
                    }

                    this.formatedDate = localizeService.getFormattedString(this.selectedTime, this.detail.type);
                };

                /**
                 * @func openDate
                 * @desc
                 */
                /*this.triggerFocus = function (input) {
                 cordova.plugins.Keyboard.close();


                 $timeout(function() {
                 var inputTrigger = document.getElementById('trigger' + tabOrder);
                 angular.element(inputTrigger).trigger('blur');

                 $timeout(function() {
                 var el = document.getElementById(input);
                 angular.element(el).trigger('focus');
                 }, 100);

                 }, 100);
                 };*/
            },
            transclude: 'true',
            controllerAs: '$ctrl'
        });
})(angular, moment);

'use strict';

angular.module('oinio.core.pageLayoutRenderer')
    .component('multiPicklistComponent', {
        templateUrl: 'app/core/pagelayout/layoutitems/multipicklist.component/multipicklist.component.html',
        require: {
            form: '^form'
        },
        bindings: {
            value: '<',
            detail: '<',
            required: '<',
            tabOrder: '<',
            editableForUpdate: '<',
            readOnlyFields: '<'
        },
        controller: function ($filter, UtilService) {
            this.selectInputName = '$picklist-' + this.detail.name;
            this.selectedPicklistValues = this.value;
            this.itemEditableForUpdate = false;

            this.deselectItem = {
                'label': '---',
                'value': '---'
            };

            /**
             * @func itemIsEditableForUpdate
             * @desc Checks whether the respective item is editable.
             */
            this.itemIsEditableForUpdate = function () {
                if (this.readOnlyFields && this.readOnlyFields.indexOf(this.detail.name) !== -1) {
                    return false;
                } else {
                    return this.editableForUpdate;
                }
            };

            /**
             * on init
             */
            this.$onInit = function () {
                void 0;

                this.selectedOptions = [];
                this.selectOptions = [];

                var picklistValues = this.detail.picklistValues;

                this.itemEditableForUpdate = this.itemIsEditableForUpdate();

                if(!UtilService.isAndroidOS()) {
                    this.selectOptions.push(this.deselectItem);
                }

                //TODO: handle default vaules
                for (var i = 0; i < picklistValues.length; i++) {
                    var item = picklistValues[i];

                    var selectItem = {
                        'label': item.label,
                        'value': item.value
                    };

                    // set currently selected item
                    if (this.value && this.value.indexOf(item.value) !== -1) {
                        this.selectedOptions.push(selectItem);

                        // set value initialize in selectedPicklistValues for Validation
                        //this.selectedPicklistValues = this.selectedOptions;
                    }

                    // fill select options with active picklist items
                    if (item.active) {
                        this.selectOptions.push(selectItem);
                    }
                }
                this.multiPickListLabel = _getSelectedLabel(this.selectedOptions);
            };

            /**
             * set selected values
             * @param {array} selected
             */
            this.setSelected = function () {

                for(var j = this.selectedOptions.length - 1; j >= 0; j--)
                {
                    if(this.selectedOptions[j].value === this.deselectItem.value){
                        this.selectedOptions.splice(j, 1);
                    }
                }

                this.selectedPicklistValues = '';
                var plValuesString = '';
                // build sobject value for multipicklist field
                if (angular.isArray(this.selectedOptions)) {
                    for (var i = 0; i < this.selectedOptions.length; i++) {
                        var item = this.selectedOptions[i];
                        if (plValuesString !== '' && plValuesString !== '---') {
                            plValuesString = plValuesString + ';';
                        }
                        plValuesString = plValuesString + item.value;
                    }
                    // setting the selected Picklist values
                    this.selectedPicklistValues = plValuesString;
                    // set value in form
                    this.form[this.detail.name].$setViewValue(plValuesString);

                    this.multiPickListLabel = _getSelectedLabel(this.selectedOptions);
                }
            };


            var _getSelectedLabel = function(selected) {
                var output;
                var numOfElements = selected.length;

                if (numOfElements == 1)
                {
                    output = selected[0]['label'];
                }
                else
                {
                    output = numOfElements + ' ' + $filter('translate')('cl.global.lb_items');
                }
                return output;
            }

        },
        transclude: 'true',
        controllerAs: '$ctrl'
    });

'use strict';

angular.module('oinio.core.pageLayoutRenderer')
    .component('numberComponent', {
        templateUrl: 'app/core/pagelayout/layoutitems/number.component/number.component.html',
        require: {
            form: '^form'
        },
        bindings: {
            value: '<',
            detail: '<',
            required: '<',
            tabOrder: '<',
            editableForUpdate: '<',
            readOnlyFields: '<',
            onChange: '&'
        },
        controller: function () {

            this.itemEditableForUpdate = false;

            /**
             * @func itemIsEditableForUpdate
             * @desc Checks whether the respective item is editable.
             */
            this.itemIsEditableForUpdate = function () {
                if (this.readOnlyFields && this.readOnlyFields.indexOf(this.detail.name) !== -1) {
                    return false;
                } else {
                    return this.editableForUpdate;
                }
            };

            this.$onInit = function () {
                void 0;
                this.itemEditableForUpdate = this.itemIsEditableForUpdate();
            };
            this.change = function () {
                if (this.onChange) {
                    this.onChange({fieldName: this.detail.name});
                }
            };
        },
        transclude: 'true',
        controllerAs: '$ctrl'
    });

'use strict';

angular.module('oinio.core.pageLayoutRenderer')
    .component('picklistComponent', {
        templateUrl: 'app/core/pagelayout/layoutitems/picklist.component/picklist.component.html',
        require: {
            form: '^form'
        },
        bindings: {
            value: '<',
            detail: '<',
            required: '<',
            tabOrder: '<',
            editableForUpdate: '<',
            readOnlyFields: '<',
            onChange: '&'
        },
        controller: function () {

            this.itemEditableForUpdate = false;

            /**
             * @func itemIsEditableForUpdate
             * @desc Checks whether the respective item is editable.
             */
            this.itemIsEditableForUpdate = function () {
                if (this.readOnlyFields && this.readOnlyFields.indexOf(this.detail.name) !== -1) {
                    return false;
                } else {
                    return this.editableForUpdate;
                }
            };

            this.$onInit = function () {
                void 0;

                this.itemEditableForUpdate = this.itemIsEditableForUpdate();
                this.selectInputName = '$picklist-' + this.detail.name;
                this.selectedOption = {};
                this.selectOptions = [];

                var picklistValues = this.detail.picklistValues;

                //TODO: handle default vaules
                for (var i = 0; i < picklistValues.length; i++) {
                    var item = picklistValues[i];

                    var selectItem = {
                        'label': item.label,
                        'value': item.value
                    };

                    // set currently selected item
                    if (this.value === item.value) {
                        this.selectedOption = selectItem;
                    }

                    // fill select options with active picklist items
                    if (item.active) {
                        this.selectOptions.push(selectItem);
                    }
                }
            };

            this.change = function () {
                this.form[this.detail.name].$setViewValue(this.form[this.selectInputName].$viewValue);
                if (this.onChange) {
                    this.onChange({fieldName: this.detail.name});
                }
            };
        },
        transclude: 'true',
        controllerAs: '$ctrl'
    });

'use strict';

angular.module('oinio.core.pageLayoutRenderer')
    .component('referenceComponent', {
        templateUrl: 'app/core/pagelayout/layoutitems/reference.component/reference.component.html',
        require: {
            form: '^form'
        },
        bindings: {
            value: '<',
            detail: '<',
            required: '<',
            sobject: '<',
            tabOrder: '<',
            editableForUpdate: '<',
            readOnlyFields: '<',
            onChange: '&'
        },
        controller: function ($scope, $filter, $sce, localizeService, LocalDataService, SimpleModalService, DescribeService) {
            var _this = this;

            _this.itemEditableForUpdate = false;

            /**
             * @func itemIsEditableForUpdate
             * @desc Checks whether the respective item is editable.
             */
            _this.itemIsEditableForUpdate = function () {
                if (_this.readOnlyFields && _this.readOnlyFields.indexOf(_this.detail.name) !== -1) {
                    return false;
                } else {
                    return _this.editableForUpdate;
                }
            };

            _this.$onInit = function () {
                void 0;
                _this.itemEditableForUpdate = _this.itemIsEditableForUpdate();
            };
            _this.getReferenceLabel = function (relationshipName, objectType) {
                return localizeService.getReferenceLabel(_this.sobject, relationshipName, objectType);
            };

            _this.resetValue = function () {
                _this.value = undefined;
                _this.sobject[_this.detail.name + '_sid'] = undefined;
                _this.sobject[_this.detail.name + '_rt'] = undefined;
                _this.referencedObjectName = undefined;
            };

            _this.referencedObjectName = _this.getReferenceLabel(_this.detail.relationshipName, _this.detail.type);

            if (_this.detail['referenceTo'] && _this.detail['referenceTo'].length === 1) {
                _this.placeholder = 'Select ' + $filter('translate')(_this.detail['referenceTo'] + '.label');
            } else {
                _this.placeholder = 'Select';
            }

            _this.editReferenceValue = function () {

                // filter exist local reference object name
                LocalDataService.resolveRefer2ExistingObjectNames(_this.detail['referenceTo']).then(function (objNames) {
                    _this.referenceTo = objNames;

                    if (_this.referenceTo && _this.referenceTo.length > 0) {

                        initModalScope();

                        SimpleModalService
                            .init('content-type-reference-modal.html', $scope, 'slide-in-up')
                            .then(function (modal) {
                                document.getElementById('ref-' + _this.detail.name).blur();
                                modal.show();
                            });

                    }
                }, function (error) {
                    void 0;
                });
            };

            this.change = function () {
                if (this.onChange) {
                    this.onChange({fieldName: this.detail.name});
                }
            };

            // ====================================================================
            // Below are operation functions in reference modal window.
            // Modal template url is 'content-type-reference-modal.html'.
            // ====================================================================

            var limitSize = 50;
            var pageSize = 10;

            var initModalScope = function () {

                _this.objectType = _this.referenceTo[0];
                _this.searchTerm = undefined;
                _this.searchResults = [];
                _this.showingRecords = [];
                //_this.recentViewRecords = [];
                _this.selectOptions = [];
                _this.message = null;

                angular.forEach(_this.referenceTo, function (objName) {
                    _this.selectOptions.push({
                        'name': $filter('translate')(objName + '.label'),
                        'value': objName
                    });
                });

                _this.search = function (searchTerm) {
                    _this.message = null;
                    if (!searchTerm || (searchTerm && searchTerm.trim().length < 3)) {
                        _this.message = $filter('translate')('cl.global.msg_searchTermLengthRequired');
                    } else {

                        LocalDataService.getFilterConfigByObjectType(_this.sobject.attributes.type).then(function(filterConfigByObjectType){
                            
                            if (filterConfigByObjectType.length) {
                                // BUILD LOOKUPFILTER QUERY STRING
                                var filterConfig = " AND ";
                                for (var i = 0 ; i < filterConfigByObjectType.length ; i++) {
                                    if (filterConfigByObjectType[i].field == _this.detail.name) {
                                        filterConfig += filterConfigByObjectType[i].condition;
                                    }
                                }
                                // DEFINE searchPattern TO DYNAMICALLY SET VARIABLES FROM SOBJECT
                                var searchPattern = new RegExp('###(.*)###');
                                // CHECK IF PATTERN IS INCLUDED IN filterConfig STRING
                                if (searchPattern.test(filterConfig)) {
                                    // GET VALUE FROM PATTERN AND THE FIELD WITH PATTERN FORMAT IN ARRAY [0]=###VALUE### [1]=VALUE
                                    var fieldName = searchPattern.exec(filterConfig);
                                    // SEARCH FOR ATTRIBUTE IN SOBJECT
                                    if (_this.sobject.hasOwnProperty(fieldName[1])) {
                                        // DYNAMICALLY REPLACE THE PLACEHOLDER WITH VALUE IN filterConfig STRING
                                        filterConfig = filterConfig.replace(fieldName[0], _this.sobject[fieldName[1]]);
                                    }
                                }

                                LocalDataService.globalSearch(_this.objectType, searchTerm, limitSize, null, 'ASC', filterConfig).then(function (resolve) {
                                    _this.searchResults = resolve;
                                    _this.showingRecords = _this.searchResults.slice(0, pageSize);
                                    cordova.plugins.Keyboard.close();
                                    if (!resolve || !resolve.length) {
                                        _this.message = $filter('translate')('cl.global.msg_searchWithNoResults').trim() + ' \'' + searchTerm + '\'';
                                    }
                                });
                            } else {
                                LocalDataService.globalSearch(_this.objectType, searchTerm, limitSize).then(function (resolve) {
                                    _this.searchResults = resolve;
                                    _this.showingRecords = _this.searchResults.slice(0, pageSize);
                                    cordova.plugins.Keyboard.close();
                                    if (!resolve || !resolve.length) {
                                        _this.message = $filter('translate')('cl.global.msg_searchWithNoResults').trim() + ' \'' + searchTerm + '\'';
                                    }
                                });
                            }

                        });
                    }
                };

                _this.loadMore = function () {
                    _this.showingRecords = _this.showingRecords.concat(_this.searchResults.slice(_this.showingRecords.length, _this.showingRecords.length + pageSize));
                    $scope.$broadcast('scroll.infiniteScrollComplete');
                };

                _this.moreDataCanBeLoaded = function () {
                    return _this.showingRecords.length < _this.searchResults.length;
                };

                _this.changeObjectType = function (firstLoading) {
                    _this.objectLabel = $filter('translate')(_this.objectType + '.label');
                    DescribeService.getTabIconPathInAsset(_this.objectType).then(function (iconPath) {
                        _this.objectTabIconPath = iconPath;
                    }, function (error) {
                        _this.objectTabIconPath = undefined;
                    });

                    if (!firstLoading && _this.searchTerm && _this.searchTerm.trim().length >= 3) {
                        _this.search(_this.searchTerm);
                    }
                };

                _this.changeObjectType(true);

                _this.selectReference = function (selectedItem) {
                    _this.value = selectedItem.Id;
                    _this.sobject[_this.detail.name] = selectedItem.Id;
                    _this.sobject[_this.detail.name + '_sid'] = selectedItem._soupEntryId;
                    _this.sobject[_this.detail.name + '_type'] = _this.objectType;

                    // build sub-sobject
                    _this.sobject[_this.detail.relationshipName] = {
                        Id: selectedItem.Id,
                        Name: selectedItem.Name,
                        _soupEntryId: selectedItem._soupEntryId,
                        type: _this.objectType
                    };

                    _this.referencedObjectName = selectedItem.Name;

                    $scope.closeModal();
                };
            };

            // ====================================================================
            // Reference modal window functions end.
            // ====================================================================

        },
        transclude: 'true',
        controllerAs: '$ctrl'
    });

'use strict';

angular.module('oinio.core.pageLayoutRenderer')
    .component('richtextComponent', {
        templateUrl: 'app/core/pagelayout/layoutitems/richtext.component/richtext.component.html',
        require: {
            form: '^form'
        },
        bindings: {
            value: '<',
            detail: '<',
            required: '<',
            tabOrder: '<',
            editableForUpdate: '<'
        },
        controller: function () {

            this.itemEditableForUpdate = false;

            /**
             * @func itemIsEditableForUpdate
             * @desc Checks whether the respective item is editable.
             */
            this.itemIsEditableForUpdate = function () {
                if (this.readOnlyFields && this.readOnlyFields.indexOf(this.detail.name) !== -1) {
                    return false;
                } else {
                    return this.editableForUpdate;
                }
            };

            this.$onInit = function () {
                void 0;
                this.itemEditableForUpdate = this.itemIsEditableForUpdate();
            };
        },
        transclude: 'true',
        controllerAs: '$ctrl'
    });
'use strict';

angular.module('oinio.core.pageLayoutRenderer')
    .component('stringComponent', {
        templateUrl: 'app/core/pagelayout/layoutitems/string.component/string.component.html',
        require: {
            form: '^form'
        },
        bindings: {
            value: '<',
            detail: '<',
            required: '<',
            tabOrder: '<',
            editableForUpdate: '<',
            readOnlyFields: '<',
            onChange: '&'
        },
        controller: function () {

            this.itemEditableForUpdate = false;

            /**
             * @func itemIsEditableForUpdate
             * @desc Checks whether the respective item is editable.
             */
            this.itemIsEditableForUpdate = function () {
                if (this.readOnlyFields && this.readOnlyFields.indexOf(this.detail.name) !== -1) {
                    return false;
                } else {
                    return this.editableForUpdate;
                }
            };

            this.$onInit = function () {
                void 0;

                this.itemEditableForUpdate = this.itemIsEditableForUpdate();

                /**
                 * @desc set input type by this.detail.type
                 */
                switch (this.detail.type) {
                    case 'email':
                        this.type = 'email';
                        break;
                    case 'phone':
                        this.type = 'tel';
                        break;
                    default:
                        this.type = 'text';
                }
            };

            this.change = function () {
                if (this.onChange) {
                    this.onChange({fieldName: this.detail.name});
                }
            };
        },
        transclude: 'true',
        controllerAs: '$ctrl'
    });

'use strict';

angular.module('oinio.core.pageLayoutRenderer')
    .component('textareaComponent', {
        templateUrl: 'app/core/pagelayout/layoutitems/textarea.component/textarea.component.html',
        require: {
            form: '^form'
        },
        bindings: {
            value: '<',
            detail: '<',
            required: '<',
            tabOrder: '<',
            editableForUpdate: '<',
            hideLabel: '<',
            readOnlyFields: '<',
            onChange: '&'
        },
        controller: function () {

            this.itemEditableForUpdate = false;

            /**
             * @func itemIsEditableForUpdate
             * @desc Checks whether the respective item is editable.
             */
            this.itemIsEditableForUpdate = function () {
                if (this.readOnlyFields && this.readOnlyFields.indexOf(this.detail.name) !== -1) {
                    return false;
                } else {
                    return this.editableForUpdate;
                }
            };

            this.$onInit = function () {
                void 0;

                this.itemEditableForUpdate = this.itemIsEditableForUpdate();
            };

            this.change = function () {
                if (this.onChange) {
                    this.onChange({fieldName: this.detail.name});
                }
            };
        },
        transclude: 'true',
        controllerAs: '$ctrl'
    });
