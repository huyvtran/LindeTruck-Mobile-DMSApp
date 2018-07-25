'use strict';

angular.module('oinio.common.message-center')
    .component('overview', {
            templateUrl: 'app/common/message-center/overview/overview.component.html',
            bindings: {
            },
            controller: function ($scope, $log, $window, MessageCenterService) {
                var ctrl = this;

                /*$scope.$on('$ionicView.enter', function () { //onInit is getting fire when view entered, see comment below
                 getRecordCount();
                 });*/

                this.$onInit = function () { //after setting cache:false in routing and removing transclude:true from component defn, $onInit is getting fired every time view is entered
                    getRecordCount();
                };

                // colors used in lightning design system for standard objects; copied from $bg-standard-map from _design-token.scss
                // TODO Move this code to common and a better way to get the colors from lightning design system
                ctrl.bgStandardColorsMap = {
                    'log-a-call': 'rgb(72, 195, 204)',
                    'document': 'rgb(186, 172, 147)',
                    'environment-hub': 'rgb(84, 105, 141)',
                    'flow': 'rgb(84, 105, 141)',
                    'sossession': 'rgb(84, 105, 141)',
                    'process': 'rgb(84, 105, 141)',
                    'news': 'rgb(127, 141, 225)',
                    'home': 'rgb(239, 126, 173)',
                    'account': 'rgb(127, 141, 225)',
                    'apps-admin': 'rgb(152, 149, 238)',
                    'announcement': 'rgb(98, 183, 237)',
                    'person-account': 'rgb(127, 141, 225)',
                    'social': 'rgb(234, 116, 162)',
                    'campaign-members': 'rgb(244, 151, 86)',
                    'article': 'rgb(242, 207, 91)',
                    'answer-public': 'rgb(242, 207, 91)',
                    'answer-private': 'rgb(242, 207, 91)',
                    'answer-best': 'rgb(242, 207, 91)',
                    'avatar-loading': 'rgb(184, 195, 206)',
                    'campaign': 'rgb(244, 151, 86)',
                    'calibration': 'rgb(71, 207, 210)',
                    'avatar': 'rgb(98, 183, 237)',
                    'approval': 'rgb(80, 204, 122)',
                    'apps': 'rgb(60, 151, 221)',
                    'user': 'rgb(52, 190, 205)',
                    'evernote': 'rgb(134, 200, 111)',
                    'coaching': 'rgb(246, 117, 148)',
                    'connected-apps': 'rgb(152, 149, 238)',
                    'drafts': 'rgb(108, 161, 233)',
                    'email': 'rgb(149, 174, 197)',
                    'email-iq': 'rgb(160, 148, 237)',
                    'endorsement': 'rgb(139, 154, 227)',
                    'event': 'rgb(235, 112, 146)',
                    'dropbox': 'rgb(82, 174, 249)',
                    'concur': 'rgb(76, 195, 199)',
                    'email-chatter': 'rgb(242, 207, 91)',
                    'case-transcript': 'rgb(242, 207, 91)',
                    'case-email': 'rgb(242, 207, 91)',
                    'case-log-a-call': 'rgb(242, 207, 91)',
                    'case-comment': 'rgb(242, 207, 91)',
                    'case-change-status': 'rgb(242, 207, 91)',
                    'work-order': 'rgb(80, 227, 194)',
                    'work-order-item': 'rgb(51, 168, 220)',
                    'client': 'rgb(0, 210, 190)',
                    'contract': 'rgb(110, 192, 110)',
                    'dashboard': 'rgb(239, 110, 100)',
                    'case': 'rgb(242, 207, 91)',
                    'empty': 'rgb(129, 153, 175)',
                    'default': 'rgb(129, 153, 175)',
                    'custom': 'rgb(129, 153, 175)',
                    'canvas': 'rgb(129, 153, 175)',
                    'contact': 'rgb(160, 148, 237)',
                    'portal': 'rgb(174, 199, 112)',
                    'product': 'rgb(183, 129, 211)',
                    'pricebook': 'rgb(183, 129, 211)',
                    'feed': 'rgb(98, 183, 237)',
                    'feedback': 'rgb(109, 161, 234)',
                    'file': 'rgb(186, 172, 147)',
                    'goals': 'rgb(86, 170, 223)',
                    'groups': 'rgb(119, 158, 242)',
                    'household': 'rgb(0, 175, 160)',
                    'hierarchy': 'rgb(52, 190, 205)',
                    'insights': 'rgb(236, 148, 237)',
                    'investment-account': 'rgb(75, 192, 118)',
                    'performance': 'rgb(248, 177, 86)',
                    'link': 'rgb(122, 154, 230)',
                    'metrics': 'rgb(86, 170, 223)',
                    'note': 'rgb(230, 212, 120)',
                    'lead': 'rgb(248, 137, 98)',
                    'opportunity': 'rgb(252, 185, 91)',
                    'call': 'rgb(242, 207, 91)',
                    'call-history': 'rgb(242, 207, 91)',
                    'orders': 'rgb(118, 158, 217)',
                    'post': 'rgb(101, 202, 228)',
                    'poll': 'rgb(105, 155, 225)',
                    'photo': 'rgb(215, 209, 209)',
                    'people': 'rgb(52, 190, 205)',
                    'generic-loading': 'rgb(184, 195, 206)',
                    'group-loading': 'rgb(184, 195, 206)',
                    'recent': 'rgb(108, 161, 233)',
                    'solution': 'rgb(143, 201, 114)',
                    'record': 'rgb(125, 195, 125)',
                    'question-best': 'rgb(242, 207, 91)',
                    'question-feed': 'rgb(242, 207, 91)',
                    'related-list': 'rgb(89, 188, 171)',
                    'skill-entity': 'rgb(139, 154, 227)',
                    'scan-card': 'rgb(243, 158, 88)',
                    'report': 'rgb(46, 203, 190)',
                    'quotes': 'rgb(136, 198, 81)',
                    'task': 'rgb(75, 192, 118)',
                    'task-2': 'rgb(75, 192, 118)',
                    'team-member': 'rgb(242, 207, 91)',
                    'thanks': 'rgb(233, 105, 110)',
                    'reward': 'rgb(233, 105, 110)',
                    'thanks-loading': 'rgb(184, 195, 206)',
                    'today': 'rgb(239, 126, 173)',
                    'topic': 'rgb(86, 170, 223)',
                    'unmatched': 'rgb(98, 183, 237)',
                    'marketing-actions': 'rgb(107, 189, 110)',
                    'relationship': 'rgb(60, 151, 221)',
                    'folder': 'rgb(139, 154, 227)'
                };

                function getColorForObjectType(objectType) {
                    for (var key in ctrl.bgStandardColorsMap) {
                        if (key === objectType.toLowerCase()) {
                            return ctrl.bgStandardColorsMap[key];
                        }
                    }
                    //no match found for objectType, return a random rgb value
                    function getRandomColor() {
                        var letters = '789ABCD'.split('');
                        var color = '#';
                        for (var i = 0; i < 6; i++) {
                            color += letters[Math.floor(Math.random() * 6)];
                        }
                        return color;
                    }

                    return getRandomColor();

                }

                /**
                 * @func getRecordCount
                 * @description This function fetches the record count of all synchronised objects and the count of all dirty records
                 */
                function getRecordCount() {
                    var queuedRecordsCount = [], syncedRecordsCount = [], allRecordsCount = [];
                    MessageCenterService.getQueuedRecordsCount()
                        .then(function (response) {
                            queuedRecordsCount = response;
                            MessageCenterService.getSyncedRecordsCount()
                                .then(function (response) {
                                    syncedRecordsCount = response;
                                    //create an array of objects of the type{objectType,queuedRecordsCount,syncedRecordsCount}
                                    var getQueuedCountFor = function (objectType) {
                                        for (var i = 0; i < queuedRecordsCount.length; i++) {
                                            if (queuedRecordsCount[i].objectType === objectType) {
                                                return queuedRecordsCount[i].recordCount;
                                            }
                                        }
                                        return 0;
                                    };
                                    for (var j = 0; j < syncedRecordsCount.length; j++) {
                                        var queuedCt = getQueuedCountFor(syncedRecordsCount[j].objectType);
                                        var color = getColorForObjectType(syncedRecordsCount[j].objectType);
                                        allRecordsCount.push({objectType:syncedRecordsCount[j].objectType, queuedRecordsCount:queuedCt, syncedRecordsCount:syncedRecordsCount[j].recordCount, color:color});
                                    }
                                    ctrl.recordsCount = allRecordsCount;
                                    //now that we have the records count, load the chart
                                    ctrl.loadChart();
                                }, function (error) {
                                    $log.error('Error in overview component(getSyncedRecordsCount): ' + error);
                                });
                        }, function (error) {
                            $log.error('Error in overview component(getQueuedRecordsCount): ' + error);
                        });
                }

                /**
                 * @func loadChart
                 * @description This function creates the pie chart to display graphically the information of record count for each object type
                 */
                this.loadChart = function () {
                    //pie chart using d3 3.x version
                    var width = $window.innerWidth - 20;
                    var height = 300;
                    var radius = Math.min(width, height) / 2;
                    /*var getColorForObjectType = function (objectType) {
                        for (var key in ctrl.bgStandardColorsMap) {
                            if (key === objectType.toLowerCase()) {
                                return ctrl.bgStandardColorsMap[key];
                            }
                        }
                        //no match found for objectType, return a random rgb value
                        function getRandomColor() {
                            var letters = '789ABCD'.split('');
                            var color = '#';
                            for (var i = 0; i < 6; i++) {
                                color += letters[Math.floor(Math.random() * 6)];
                            }
                            return color;
                        }

                        return getRandomColor();

                    };*/
                    var svg = d3.select('#chart')
                        .append('svg')
                        .attr('width', width)
                        .attr('height', height)
                        .append('g')
                        .attr('transform', 'translate(' + (width / 2) +
                            ',' + (height / 2) + ')');
                    var arc = d3.svg.arc()
                        .innerRadius(0)
                        .outerRadius(radius);
                    var pie = d3.layout.pie()
                        .value(function(d) { return d.syncedRecordsCount; })
                        .sort(null);
                    var tooltip = d3.select('#chart')
                        .append('div')
                        .attr('class', 'tooltip');

                    tooltip.append('div')
                        .attr('class', 'label');

                    tooltip.append('div')
                        .attr('class', 'count');

                    var path = svg.selectAll('path')
                        .data(pie(ctrl.recordsCount))
                        .enter()
                        .append('path')
                        .attr('d', arc)
                        .attr('fill', function (d, i) {
                            return d.data.color;//getColorForObjectType(d.data.objectType);
                            //return color(d.data.label);
                        })
                        .on('click', function (d) {
                            var arcCentroidX = (d.startAngle + d.endAngle) / 2, arcCentroidY = radius / 2;
                            tooltip.select('.label').html(d.data.objectType);
                            tooltip.select('.count').html(d.data.syncedRecordsCount);
                            tooltip.attr('transform', 'translate(' + d3.event.layerX + ',' + d3.event.layerY + ')');
                            tooltip.style('display', 'block');
                            tooltip.style('background', d.data.color);
                            //tooltip.style('top', (d3.event.layerY + 10) + 'px')
                            //tooltip.style('left', (d3.event.layerX + 10) + 'px');
                        });
                    //pie chart using d3 4.0 version
                    /*var width = 360;
                    var height = 180;
                    var radius = Math.min(width, height) / 2;

                    var svg = d3.select('#chart')
                        .append('svg')
                        .attr('width', width)
                        .attr('height', height)
                        .append('g')
                        .attr('transform', 'translate(' + (width / 2) + ',' + (height / 2) + ')');
                    var arc = d3.arc()
                        .innerRadius(0)
                        .outerRadius(radius);
                    var arcs = d3.pie()
                        .value(function (d) {
                            return d.syncedRecordsCount;
                        })
                        (ctrl.recordsCount);

                    var getColorForObjectType = function (objectType) {
                        for (var key in ctrl.bgStandardColorsMap) {
                            if (key === objectType.toLowerCase()) {
                                return ctrl.bgStandardColorsMap[key];
                            }
                        }
                        //no match found for objectType, return a random rgb value
                        function getRandomColor() {
                            var letters = '789ABCD'.split('');
                            var color = '#';
                            for (var i = 0; i < 6; i++) {
                                color += letters[Math.floor(Math.random() * 6)];
                            }
                            return color;
                        }

                        return getRandomColor();

                    };
                    var tooltip = d3.select('#chart')
                        .append('div')
                        .attr('class', 'tooltip');

                    tooltip.append('div')
                        .attr('class', 'label');

                    tooltip.append('div')
                        .attr('class', 'count');

                    var path = svg.selectAll('path')
                        .data(arcs)
                        .enter()
                        .append('path')
                        .attr('d', arc)
                        .attr('fill', function (d) {
                            return getColorForObjectType(d.data.objectType);
                        })
                        .on('click', function (d) {
                            var arcCentroidX = (d.startAngle + d.endAngle) / 2, arcCentroidY = radius / 2;
                            tooltip.select('.label').html(d.data.objectType);
                            tooltip.select('.count').html(d.data.syncedRecordsCount);
                            tooltip.attr('transform', 'translate(' + arcCentroidX + ',' + arcCentroidY + ')');
                            tooltip.style('display', 'block');
                        })
                        .on('mouseout', function () {
                            tooltip.style('display', 'none');
                        });*/
                };

                /**
                 * @func getObjectTypeIcon
                 * @description This function fetches the path to the icon of the objectType
                 * @param {string}objectType
                 * @return link
                 */
                this.getObjectTypeIcon = function (objectType) {
                    return 'lib/salesforce-lightning-design-system/assets/icons/standard-sprite/svg/symbols.svg#' + objectType.toLowerCase();
                };
            }
        }
    );
