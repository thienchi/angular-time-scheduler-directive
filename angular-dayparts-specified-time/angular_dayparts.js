angular.module('angular-dayparts-minute', [])
  .directive('angularDaypartsMinute', ['$window', '$document', '$timeout', function ($window, $document, $timeout) {
    return {
      restrict: 'E',
      scope: {
        options: '=?',
        ver: '=?'
      },
      link: function (scope, element, attrs) {
        scope.contentUrl = 'app/scripts/directives/angular-dayparts-specified-time/template-' + scope.ver + '.html';
        attrs.$observe("ver", function (v) {
          scope.contentUrl = 'app/scripts/directives/angular-dayparts-specified-time/template-' + scope.ver + '.html';
        });
      },
      template: '<div ng-include="contentUrl"></div>',
      controller: ['$scope', '$element', '$attrs', function ($scope, $element, $attrs) {

        $scope.options = $scope.options || {};
        $scope.options.reset = ($scope.options.reset === undefined) ? true : $scope.options.reset;

        $scope.days = [{name: 'monday', position: 1}, {name: 'tuesday', position: 2}, {
          name: 'wednesday',
          position: 3
        }, {name: 'thursday', position: 4}, {name: 'friday', position: 5}, {
          name: 'saturday',
          position: 6
        }, {name: 'sunday', position: 7}];
        $scope.hours = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24];

        var currentVer = $scope.ver;
        if (currentVer === 5) {
          $scope.minutes1 = [05, 10, 15];
          $scope.minutes2 = [20, 25, 30];
          $scope.minutes3 = [35, 40, 45];
          $scope.minutes4 = [50, 55, 60];
        } else if (currentVer === 10) {
          $scope.minutes1 = [10, 20, 30];
          $scope.minutes2 = [];
          $scope.minutes3 = [];
          $scope.minutes4 = [40, 50, 60];
        } else if (currentVer === 15) {
          $scope.minutes1 = [15, 30];
          $scope.minutes2 = [];
          $scope.minutes3 = [];
          $scope.minutes4 = [45, 60];
        } else if (currentVer === 30) {
          $scope.minutes1 = [30];
          $scope.minutes2 = [];
          $scope.minutes3 = [];
          $scope.minutes4 = [60];
        }

        var klass = 'selected';
        var startCell = null;
        var isDragging = false;
        var selected = [];
        var isStartSelected = false;


        if ($scope.options.selected) {
          $timeout(function () {
            repopulate($scope.options.selected);
          }, 100);
        }


        /**
         * When user stop clicking make the callback with selected elements
         */
        function mouseUp() {
          if (!isDragging) {
            return;
          }
          isDragging = false;
          onChangeCallback();
        }


        /**
         * Call 'onChange' function from passed options
         */
        function onChangeCallback() {
          if ($scope.options && $scope.options.onChange) {

            // Sort by day name and time
            var sortedSelected = [];
            selected.forEach(function (item) {
              if (item === undefined) {
                return;
              }
              var el = item.split('-');
              var o = {day: _.find($scope.days, {name: el[0]}), time: parseInt(el[1]), min: parseInt(el[2])};
              sortedSelected.push(o);
            });

            sortedSelected = _.sortBy(_.sortBy(sortedSelected, function (item) {
              return item.time;
            }), function (item) {
              return item.day.position;
            });

            selected = sortedSelected.map(function (item) {
              return item.day.name + '-' + item.time + '-' + item.min;
            });
            $scope.options.onChange(selected);
          }
        }


        /**
         * User start to click
         * @param {jQuery DOM element}
         */
        function mouseDown(el) {
          isDragging = true;
          setStartCell(el);
          setEndCell(el);
        }


        /**
         * User enter in a cell still triggering click
         * @param {jQuery DOM element}
         */
        function mouseEnter(el) {
          if (!isDragging) {
            return;
          }
          setEndCell(el);
        }


        /**
         * Get the first cell clicked
         * @param {jQuery DOM element}
         */
        function setStartCell(el) {
          startCell = el;

          isStartSelected = _.contains(selected, el.data('time'));
        }


        /**
         * Get the last cell
         * @param {jQuery DOM element}
         */
        function setEndCell(el) {
          if (!isStartSelected) {
            if (!_.contains(selected, el.data('time'))) {
              _addCell($(el));
            }
          } else {
            _removeCell(el);
          }
        }


        /**
         * Get all the cells between first and last
         * @param  {jQuery DOM element} start cell
         * @param  {jQuery DOM element} end cell
         * @return {jQuery DOM elements} cells between start and end
         */
        function cellsBetween(start, end) {
          var coordsStart = getCoords(start);
          var coordsEnd = getCoords(end);


          var topLeft = {
            column: $window.Math.min(coordsStart.column, coordsEnd.column),
            row: $window.Math.min(coordsStart.row, coordsEnd.row),
          };
          var bottomRight = {
            column: $window.Math.max(coordsStart.column, coordsEnd.column),
            row: $window.Math.max(coordsStart.row, coordsEnd.row),
          };

          return $element.find('td.selectedClass').filter(function () {
            var el = angular.element(this);
            var coords = getCoords(el);
            return coords.column >= topLeft.column
              && coords.column <= bottomRight.column
              && coords.row >= topLeft.row
              && coords.row <= bottomRight.row;
          });
        }


        /**
         * Get the coordinates of a given cell
         * @param  {jQuery DOM element}
         * @return {object}
         */
        function getCoords(cell) {
          var row = cell.parents('row');
          return {
            column: cell[0].cellIndex,
            row: cell.parent()[0].rowIndex
          };
        }


        /**
         * Passing 'selected' property will make repopulate table
         */
        function repopulate() {
          selected = _.clone($scope.options.selected);
          $element.find('td.selectedClass').each(function (i, el) {
            if (_.contains(selected, $(el).data('time'))) {
              $(el).addClass(klass);
            }
          });
        }


        /**
         * Clicking on a day will select all hours
         * @param  {object} day.name, day.position
         */
        $scope.selectDay = function (day) {

          var numSelectedHours = selected.filter(function (item) {
            return item.split('-')[0] === day.name;
          }).length;
          $element.find('table td.repeatDay-' + day.position).each(function (i, el) {
            if (numSelectedHours === 50) {
              _removeCell($(el));
            } else if (!_.contains(selected, $(el).data('time'))) {
              _addCell($(el));
            }

          });
          onChangeCallback();
        };


        /**
         * Clicking on a hour will select all days at that hour
         * @param  {int}
         */
        $scope.selectHour = function (hour) {
          var hour = hour - 1; // previous selected hour

          var numSelectedDays = $element.find('table td.selected.repeatHour-' + hour).length;

          $element.find('table td.repeatHour-' + hour).each(function (i, el) {

            if (numSelectedDays === 14) {
              _removeCell($(el));
            } else if (!_.contains(selected, $(el).data('time'))) {
              _addCell($(el));
            }
          });
          onChangeCallback();
        };

        /**
         * Remove all selected hours
         */
        $scope.reset = function () {
          selected = [];
          $element.find('td').each(function (i, el) {
            $(el).removeClass(klass);
          });
          onChangeCallback();
        };


        /**
         * Remove css class from table and element from selected array
         * @param  {jQuery DOM element} cell
         */
        function _removeCell(el) {
          el.removeClass(klass);
          selected = _.without(selected, el.data('time'));
        }


        /**
         * Add css class to table and element to selected array
         * @param  {jQuery DOM element} cell
         */
        function _addCell(el) {
          el.addClass(klass);

          selected.push(el.data('time'));
        }


        function wrap(fn) {
          return function () {
            var el = angular.element(this);
            $scope.$apply(function () {
              fn(el);
            });
          }
        }


        /**
         * Mouse events
         */
        $element.delegate('td.selectedClass', 'mousedown', wrap(mouseDown));
        $element.delegate('td.selectedClass', 'mouseenter', wrap(mouseEnter));
        $document.delegate('body', 'mouseup', wrap(mouseUp));

      }]
    }
  }]);
