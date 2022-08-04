'use strict';

angular.module('QuepidApp')
  .controller('FrogReportModalInstanceCtrl', [
    '$uibModalInstance', '$scope',
    'theCase', 'queriesSvc',
    function ($uibModalInstance, $scope, theCase, queriesSvc) {
      var ctrl = this;

      ctrl.theCase = theCase;
      ctrl.queriesSvc = queriesSvc;

      $scope.totalNumberOfRatingsNeeded = null;
      $scope.missingRatingsRate = null;
      $scope.numberOfRatings = null;
      $scope.depthOfRating = null;
      $scope.numberOfMissingRatingsByMissingCount = null;
      $scope.tableOfRatings = null;
      $scope.numberOfMissingRatings = null;
      $scope.totalNumberQueriesWithResults = 0;
      $scope.totalNumberQueriesWithoutResults = 0;

      /* jshint ignore:start */
      // We don't format the Vega spec as this is generated by Vega tooling.
      // We replace the data[0].values with our own data furthur down.
      $scope.spec = {
        "$schema": "https://vega.github.io/schema/vega/v5.json",
        "description": "A basic bar chart example, with value labels shown upon mouse hover.",
        "width": 800,
        "height": 200,
        "padding": 5,
        "title": {
           "text": "Summary of Query Rating Status",
           "subtitle": "Number of queries grouped by missing ratings",
           "subtitleFontStyle": "italic",
           "frame": "group",
           "anchor": "start",
           "offset": 10
         },
        "data": [
          {
            "name": "table",
            "values": [
              {"category": "Fully Rated", "amount": 28},
              {"category": "Missing 1", "amount": 55},
              {"category": "Missing 2", "amount": 43},
              {"category": "Missing 3", "amount": 91},
              {"category": "Missing 4", "amount": 81},
              {"category": "Missing 5", "amount": 81},
              {"category": "Missing 6", "amount": 53},
              {"category": "Missing 7", "amount": 19},
              {"category": "Missing 8", "amount": 81},
              {"category": "Missing 9", "amount": 10},
              {"category": "No Ratings", "amount": 87}
            ]
          }
        ],

        "signals": [
          {
            "name": "tooltip",
            "value": {},
            "on": [
              {"events": "rect:mouseover", "update": "datum"},
              {"events": "rect:mouseout",  "update": "{}"}
            ]
          }
        ],

        "scales": [
          {
            "name": "xscale",
            "type": "band",
            "domain": {"data": "table", "field": "category"},
            "range": "width",
            "padding": 0.05,
            "round": true
          },
          {
            "name": "yscale",
            "domain": {"data": "table", "field": "amount"},
            "nice": true,
            "range": "height"
          }
        ],

        "axes": [
          { "orient": "bottom", "scale": "xscale", "title": "Rating Status" },
          { "orient": "left", "scale": "yscale", "title": "Number Queries" }
        ],

        "marks": [
          {
            "type": "rect",
            "from": {"data":"table"},
            "encode": {
              "enter": {
                "x": {"scale": "xscale", "field": "category"},
                "width": {"scale": "xscale", "band": 1},
                "y": {"scale": "yscale", "field": "amount"},
                "y2": {"scale": "yscale", "value": 0}
              },
              "update": {
                "fill": {"value": "steelblue"}
              },
              "hover": {
                "fill": {"value": "red"}
              }
            }
          },
          {
            "type": "text",
            "encode": {
              "enter": {
                "align": {"value": "center"},
                "baseline": {"value": "bottom"},
                "fill": {"value": "#333"}
              },
              "update": {
                "x": {"scale": "xscale", "signal": "tooltip.category", "band": 0.5},
                "y": {"scale": "yscale", "signal": "tooltip.amount", "offset": -2},
                "text": {"signal": "tooltip.amount"},
                "fillOpacity": [
                  {"test": "datum === tooltip", "value": 0},
                  {"value": 1}
                ]
              }
            }
          }
        ]
      };

      /* jshint ignore:end */
      ctrl.tableOfRatings = function () {
        var numberOfMissingRatingsByMissingCount = ctrl.numberOfMissingRatingsByMissingCount();
        var rows = [];

        angular.forEach(Object.keys(numberOfMissingRatingsByMissingCount).sort(function(a, b){return parseInt(a)-parseInt(b);}), function(key) {
          rows.push({'category': numberOfMissingRatingsByMissingCount[key].label, 'amount': numberOfMissingRatingsByMissingCount[key].count});
        });
        return [
          {
            'name': 'table',
            'values': rows
          }
        ];
      };

      ctrl.numberOfMissingRatings = function () {
        var countMissingRatings = 0;
        angular.forEach(queriesSvc.queries, function(q) {
          countMissingRatings = countMissingRatings + q.currentScore.countMissingRatings;
        });

        return countMissingRatings;
      };

      ctrl.numberOfMissingRatingsByMissingCount = function () {
        var depthOfRating = ctrl.depthOfRating();
        var missingRatingsTable = {};
        angular.forEach(queriesSvc.queries, function(q) {
          var missingCount = parseInt(q.currentScore.countMissingRatings);
          if (!missingRatingsTable.hasOwnProperty(missingCount)){
            missingRatingsTable[missingCount] = {
              count: 0
            };
            if (missingCount === 0){
              missingRatingsTable[missingCount].label = 'Fully Rated';
            }
            else if (missingCount === depthOfRating){
              missingRatingsTable[missingCount].label = 'No Ratings';
            }
            else {
              missingRatingsTable[missingCount].label = 'Missing ' + missingCount;
            }
          }
          missingRatingsTable[missingCount].count = missingRatingsTable[missingCount].count + 1;
        });

        return missingRatingsTable;
      };

      // What percentage of our total query/doc pairs are missing ratings?
      ctrl.missingRatingsRate = function () {
        var numberOfMissingRatings = $scope.numberOfMissingRatings;
        var totalNumberOfRatings = $scope.totalNumberOfRatingsNeeded;

        return Math.trunc((numberOfMissingRatings / totalNumberOfRatings) * 100);
      };

      ctrl.totalNumberOfRatingsNeeded = function () {
        var totalNumberOfRatingsNeeded = 0;
        angular.forEach(queriesSvc.queries, function(q) {
          if (q.depthOfRating){
            $scope.totalNumberQueriesWithResults += 1;
            totalNumberOfRatingsNeeded = totalNumberOfRatingsNeeded + q.depthOfRating;
          }
          else {
            $scope.totalNumberQueriesWithoutResults += 1;
          }
        });
        $scope.totalNumberOfRatingsNeeded = totalNumberOfRatingsNeeded;
      };

      ctrl.depthOfRating = function () {
        var depthOfRating = 0;
        angular.forEach(queriesSvc.queries, function(q) {
          if (q.depthOfRating > depthOfRating){
            depthOfRating = q.depthOfRating;
          }
        });
        return depthOfRating;
      };

      ctrl.numberOfRatings = function () {
        var countRatings = 0;
        angular.forEach(queriesSvc.queries, function(q) {
          countRatings = countRatings + Object.keys(q.ratings).length;
        });

        return countRatings;
      };

      ctrl.calculateStatistics = function () {
          ctrl.totalNumberOfRatingsNeeded();

          $scope.numberOfRatings = ctrl.numberOfRatings();
          $scope.depthOfRating = ctrl.depthOfRating();
          $scope.numberOfMissingRatingsByMissingCount = ctrl.numberOfMissingRatingsByMissingCount();
          $scope.tableOfRatings = ctrl.tableOfRatings();
          $scope.numberOfMissingRatings = ctrl.numberOfMissingRatings();
          $scope.missingRatingsRate = ctrl.missingRatingsRate();
      };

      ctrl.ok = function () {
        $uibModalInstance.close(ctrl.options);
      };

      ctrl.cancel = function () {
        $uibModalInstance.dismiss('cancel');
      };

      // populate specific data in the specification for the chart.
      $scope.spec.data = ctrl.tableOfRatings();

      ctrl.calculateStatistics();
    }
  ]);
