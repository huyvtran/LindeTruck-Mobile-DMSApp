angular.module('ionic-datepicker.provider', []).provider('ionicDatePicker', function () {

    var config = {
        setLabel: 'Set',
        todayLabel: 'Today',
        closeLabel: 'Close',
        inputDate: new Date(),
        mondayFirst: true,
        weeksList: ["S", "M", "T", "W", "T", "F", "S"],
        monthsList: ["Jan", "Feb", "March", "April", "May", "June", "July", "Aug", "Sept", "Oct", "Nov", "Dec"],
        templateType: 'popup',
        showTodayButton: false,
        closeOnSelect: false,
        disableWeekdays: [],
        showSetButton: false
    };

    this.configDatePicker = function(inputObj) {
        angular.extend(config, inputObj);
    };

    this.$get = ['$rootScope', '$ionicPopup', '$ionicModal', 'IonicDatepickerService', function($rootScope, $ionicPopup, $ionicModal, IonicDatepickerService) {

        var provider = {};

        var $scope = $rootScope.$new();
        $scope.today = resetHMSM(new Date()).getTime();
        $scope.disabledDates = [];
        $scope.time = {};

        //Reset the hours, minutes, seconds and milli seconds
        function resetHMSM(currentDate) {
            currentDate.setHours(0);
            currentDate.setMinutes(0);
            currentDate.setSeconds(0);
            currentDate.setMilliseconds(0);
            return currentDate;
        }

        //Increasing the hours
        $scope.increaseHours = function() {
            $scope.time.hours = Number($scope.time.hours);
            if ($scope.mainObj.datetime.format == 12) {
                if ($scope.time.hours != 12) {
                    $scope.time.hours += 1;
                } else {
                    $scope.time.hours = 1;
                }
            }
            if ($scope.mainObj.datetime.format == 24) {
                $scope.time.hours = ($scope.time.hours + 1) % 24;
            }
            $scope.time.hours = ($scope.time.hours < 10) ? ('0' + $scope.time.hours) : $scope.time.hours;
        };

        //Decreasing the hours
        $scope.decreaseHours = function() {
            $scope.time.hours = Number($scope.time.hours);
            if ($scope.mainObj.datetime.format == 12) {
                if ($scope.time.hours > 1) {
                    $scope.time.hours -= 1;
                } else {
                    $scope.time.hours = 12;
                }
            }
            if ($scope.mainObj.datetime.format == 24) {
                $scope.time.hours = ($scope.time.hours + 23) % 24;
            }
            $scope.time.hours = ($scope.time.hours < 10) ? ('0' + $scope.time.hours) : $scope.time.hours;
        };

        //Increasing the minutes
        $scope.increaseMinutes = function() {
            $scope.time.minutes = Number($scope.time.minutes);
            $scope.time.minutes = ($scope.time.minutes + $scope.mainObj.datetime.step) % 60;
            $scope.time.minutes = ($scope.time.minutes < 10) ? ('0' + $scope.time.minutes) : $scope.time.minutes;
        };

        //Decreasing the minutes
        $scope.decreaseMinutes = function() {
            $scope.time.minutes = Number($scope.time.minutes);
            $scope.time.minutes = ($scope.time.minutes + (60 - $scope.mainObj.datetime.step)) % 60;
            $scope.time.minutes = ($scope.time.minutes < 10) ? ('0' + $scope.time.minutes) : $scope.time.minutes;
        };

        //Changing the meridian
        $scope.changeMeridian = function() {
            $scope.time.meridian = ($scope.time.meridian === "AM") ? "PM" : "AM";
        };

        function setMinSecs(ipTime, format) {
            $scope.time.hours = Math.floor(ipTime / (60 * 60));

            var rem = ipTime % (60 * 60);
            if (format == 12) {
                if ($scope.time.hours > 12) {
                    $scope.time.hours -= 12;
                    $scope.time.meridian = 'PM';
                } else {
                    $scope.time.meridian = 'AM';
                }
            }
            $scope.time.minutes = rem / 60;

            $scope.time.hours = $scope.time.hours.toFixed(0);
            $scope.time.minutes = $scope.time.minutes.toFixed(0);

            if ($scope.time.hours.toString().length == 1) {
                $scope.time.hours = '0' + $scope.time.hours;
            }
            if ($scope.time.minutes.toString().length == 1) {
                $scope.time.minutes = '0' + $scope.time.minutes;
            }
            $scope.time.format = $scope.mainObj.datetime.format;
        }

        //Previous month
        $scope.prevMonth = function() {
            if ($scope.currentDate.getMonth() === 1) {
                $scope.currentDate.setFullYear($scope.currentDate.getFullYear());
            }
            $scope.currentDate.setMonth($scope.currentDate.getMonth() - 1);
            $scope.currentMonth = $scope.mainObj.monthsList[$scope.currentDate.getMonth()];
            $scope.currentYear = $scope.currentDate.getFullYear();
            refreshDateList($scope.currentDate);
        };

        //Next month
        $scope.nextMonth = function() {
            if ($scope.currentDate.getMonth() === 11) {
                $scope.currentDate.setFullYear($scope.currentDate.getFullYear());
            }
            $scope.currentDate.setDate(1);
            $scope.currentDate.setMonth($scope.currentDate.getMonth() + 1);
            $scope.currentMonth = $scope.mainObj.monthsList[$scope.currentDate.getMonth()];
            $scope.currentYear = $scope.currentDate.getFullYear();
            refreshDateList($scope.currentDate);
        };

        //Date selected
        $scope.dateSelected = function(selectedDate) {
            if (!selectedDate || Object.keys(selectedDate).length === 0) return;
            var resultTime = 0;
            $scope.selctedDateEpoch = selectedDate.epoch;
            resultTime += $scope.selctedDateEpoch;

            // add datetime seconds
            if ($scope.mainObj.datetime) {
                var totalSec = 0;
                var hours = angular.copy($scope.time.hours);
                if ($scope.time.format == 12) {
                    if ($scope.time.meridian == 'PM') {
                        hours = Number(hours);
                        hours += 12;
                    }
                    totalSec = (hours * 60 * 60) + ($scope.time.minutes * 60);
                } else {
                    totalSec = (hours * 60 * 60) + ($scope.time.minutes * 60);
                }

                resultTime += totalSec * 1000;
            }

            if ($scope.mainObj.closeOnSelect) {
                $scope.mainObj.callback(resultTime);
                if ($scope.mainObj.templateType.toLowerCase() == 'popup') {
                    $scope.popup.close();
                } else {
                    closeModal();
                }
            }
        };

        //Set today as date for the modal
        $scope.setIonicDatePickerTodayDate = function() {
            var today = new Date();
            refreshDateList(new Date());
            $scope.selctedDateEpoch = resetHMSM(today).getTime();
            var resultTime = 0;
            resultTime += $scope.selctedDateEpoch;

            // add datetime seconds
            if ($scope.mainObj.datetime) {
                var totalSec = 0;
                var hours = angular.copy($scope.time.hours);
                if ($scope.time.format == 12) {
                    if ($scope.time.meridian == 'PM') {
                        hours = Number(hours);
                        hours += 12;
                    }
                    totalSec = (hours * 60 * 60) + ($scope.time.minutes * 60);
                } else {
                    totalSec = (hours * 60 * 60) + ($scope.time.minutes * 60);
                }

                resultTime += totalSec * 1000;
            }

            if ($scope.mainObj.closeOnSelect) {
                $scope.mainObj.callback(resultTime);
                if ($scope.mainObj.templateType.toLowerCase() == 'popup') {
                    $scope.popup.close();
                } else {
                    closeModal();
                }
            }
        };

        //Set date for the modal
        $scope.setIonicDatePickerDate = function() {
            // add datetime seconds
            var resultTime = 0;
            if ($scope.mainObj.datetime) {
                var totalSec = 0;
                var hours = angular.copy($scope.time.hours);
                if ($scope.time.format == 12) {
                    if ($scope.time.meridian == 'PM') {
                        hours = Number(hours);
                        hours += 12;
                    }
                    totalSec = (hours * 60 * 60) + ($scope.time.minutes * 60);
                } else {
                    totalSec = (hours * 60 * 60) + ($scope.time.minutes * 60);
                }

                resultTime += totalSec * 1000;
            }

            resultTime += $scope.selctedDateEpoch;

            $scope.mainObj.callback(resultTime);
            if ($scope.mainObj.templateType.toLowerCase() == 'popup') {
                $scope.popup.close();
            } else {
                closeModal();
            }
        };

        $scope.set2today = function() {
            var today = new Date();
            refreshDateList(new Date());
            $scope.selctedDateEpoch = resetHMSM(today).getTime();
        };

        //Setting the disabled dates list.
        function setDisabledDates(mainObj) {
            if (!mainObj.disabledDates || mainObj.disabledDates.length === 0) {
                $scope.disabledDates = [];
            } else {
                $scope.disabledDates = [];
                angular.forEach(mainObj.disabledDates, function(val, key) {
                    val = resetHMSM(new Date(val));
                    $scope.disabledDates.push(val.getTime());
                });
            }
        }

        //Refresh the list of the dates of a month
        function refreshDateList(currentDate) {
            currentDate = resetHMSM(currentDate);
            $scope.currentDate = angular.copy(currentDate);

            var firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDate();
            var lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();

            $scope.monthsList = [];
            if ($scope.mainObj.monthsList && $scope.mainObj.monthsList.length === 12) {
                $scope.monthsList = $scope.mainObj.monthsList;
            } else {
                $scope.monthsList = IonicDatepickerService.monthsList;
            }

            $scope.yearsList = IonicDatepickerService.getYearsList($scope.mainObj.from, $scope.mainObj.to);

            $scope.dayList = [];

            var tempDate, disabled;
            $scope.firstDayEpoch = resetHMSM(new Date(currentDate.getFullYear(), currentDate.getMonth(), firstDay)).getTime();
            $scope.lastDayEpoch = resetHMSM(new Date(currentDate.getFullYear(), currentDate.getMonth(), lastDay)).getTime();

            for (var i = firstDay; i <= lastDay; i++) {
                tempDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), i);
                disabled = (tempDate.getTime() < $scope.fromDate) || (tempDate.getTime() > $scope.toDate) || $scope.mainObj.disableWeekdays.indexOf(tempDate.getDay()) >= 0;

                $scope.dayList.push({
                    date: tempDate.getDate(),
                    month: tempDate.getMonth(),
                    year: tempDate.getFullYear(),
                    day: tempDate.getDay(),
                    epoch: tempDate.getTime(),
                    disabled: disabled
                });
            }

            //To set Monday as the first day of the week.
            var firstDayMonday = $scope.dayList[0].day - $scope.mainObj.mondayFirst;
            firstDayMonday = (firstDayMonday < 0) ? 6 : firstDayMonday;

            for (var j = 0; j < firstDayMonday; j++) {
                $scope.dayList.unshift({});
            }

            $scope.rows = [0, 7, 14, 21, 28, 35];
            $scope.cols = [0, 1, 2, 3, 4, 5, 6];

            $scope.currentMonth = $scope.mainObj.monthsList[currentDate.getMonth()];
            $scope.currentYear = currentDate.getFullYear();
            $scope.currentMonthSelected = angular.copy($scope.currentMonth);
            $scope.currentYearSelected = angular.copy($scope.currentYear);
            $scope.numColumns = 7;
        }

        //Month changed
        $scope.monthChanged = function(month) {
            var monthNumber = $scope.monthsList.indexOf(month);
            $scope.currentDate.setMonth(monthNumber);
            refreshDateList($scope.currentDate);
        };

        //Year changed
        $scope.yearChanged = function(year) {
            $scope.currentDate.setFullYear(year);
            refreshDateList($scope.currentDate);
        };

        //Setting up the initial object
        function setInitialObj(ipObj) {
            $scope.mainObj = angular.copy(ipObj);
            $scope.selctedDateEpoch = resetHMSM($scope.mainObj.inputDate).getTime();

            if ($scope.mainObj.weeksList && $scope.mainObj.weeksList.length === 7) {
                $scope.weeksList = $scope.mainObj.weeksList;
            } else {
                $scope.weeksList = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
            }
            if ($scope.mainObj.mondayFirst) {
                $scope.weeksList.push($scope.mainObj.weeksList.shift());
            }
            $scope.disableWeekdays = $scope.mainObj.disableWeekdays;

            refreshDateList($scope.mainObj.inputDate);
            setDisabledDates($scope.mainObj);
        }

        $scope.$on('$destroy', function() {
            $scope.modal.remove();
        });

        function openModal() {
            if ($scope.modal) {
                $scope.modal.show();
            } else {
                $ionicModal.fromTemplateUrl('ionic-datepicker-modal.html', {
                    scope: $scope,
                    animation: 'slide-in-up'
                }).then(function(modal) {
                    $scope.modal = modal;
                    $scope.modal.show();
                });
            }
        }

        function closeModal() {
            if ($scope.modal) {
                $scope.modal.hide();
                $scope.modal.remove();
                $scope.modal = null;
            }
        }

        $scope.closeIonicDatePickerModal = function() {
            closeModal();
        };

        //Open datepicker popup
        provider.openDatePicker = function(ipObj) {
            var buttons = [];
            $scope.mainObj = angular.extend({}, config, ipObj);
            if ($scope.mainObj.from) {
                $scope.fromDate = resetHMSM(new Date($scope.mainObj.from)).getTime();
            }
            if ($scope.mainObj.to) {
                $scope.toDate = resetHMSM(new Date($scope.mainObj.to)).getTime();
            }

            if (ipObj.disableWeekdays && config.disableWeekdays) {
                $scope.mainObj.disableWeekdays = ipObj.disableWeekdays.concat(config.disableWeekdays);
            }

            if ($scope.mainObj.datetime) {
                setMinSecs($scope.mainObj.datetime.inputTime, $scope.mainObj.datetime.format);
            }

            setInitialObj($scope.mainObj);

            // if (!$scope.mainObj.closeOnSelect) {
            //   buttons = [{
            //     text: $scope.mainObj.setLabel,
            //     type: 'button_set',
            //     onTap: function (e) {
            //       $scope.mainObj.callback($scope.selctedDateEpoch);
            //     }
            //   }];
            // }

            if ($scope.mainObj.showTodayButton) {
                buttons.push({
                    text: $scope.mainObj.todayLabel,
                    type: 'button_today',
                    onTap: function(e) {
                        var today = new Date();
                        refreshDateList(new Date());
                        $scope.selctedDateEpoch = resetHMSM(today).getTime();
                        if (!$scope.mainObj.closeOnSelect) {
                            e.preventDefault();
                        }
                    }
                });
            }

            // buttons.push({
            //   text: $scope.mainObj.closeLabel,
            //   type: 'button_close',
            //   onTap: function (e) {
            //     console.log('ionic-datepicker popup closed.');
            //   }
            // });

            if ($scope.mainObj.templateType.toLowerCase() == 'popup') {
                $scope.popup = $ionicPopup.show({
                    templateUrl: 'ionic-datepicker-popup.html',
                    scope: $scope,
                    cssClass: 'ionic_datepicker_popup'
                });

                $scope.closeIonicDatePickerPopup = function() {
                    $scope.popup.close();
                };

            } else {
                openModal();
            }
        };

        return provider;

    }];

});
