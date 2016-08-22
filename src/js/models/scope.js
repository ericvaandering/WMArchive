var app = app || {};

app.Scope = Backbone.Model.extend({

  urlRoot: '/wmarchive/data/performance',

  filters: {
    'workflow': "Workflow",
    'task': "Task",
    'step': "Step",
    'host': "Host",
    'site': "Site",
    'jobtype': "Job Type",
    'jobstate': "Job State",
    'acquisitionEra': "Acquisition Era",
    'exitCode': "Error Exit Code",
    // 'time' is handled separately
  },

  all_metrics: {
    'jobstate': "Job State",
    'cpu': {
      "_title": "CPU",
      "TotalJobCPU": "CPU Consumption",
      "TotalJobTime": "Processing Time",
    },
    'storage': {
      '_title': "Storage",
      "writeTotalMB": "Write",
      "readTotalMB": "Read",
    },
    'data': {
      '_title': "Data",
      'events': "Events",
    },
  },

  defaults: {
    metrics: [ 'jobstate' ],
    axes: [ 'host', 'site' ],

    start_date: moment('2016-06-28'),
    end_date: moment(),
    workflow: null,
    task: null,
    step: null,
    host: null,
    site: null,
    acquisitionEra: null,
    jobtype: null,
    jobstate: null,
    exitCode: null,
  },

  initialize: function() {
    this.fetch();
    this.on('change:scope change:metrics change:axes', this.updateURL, this);
    this.on('change:scope', this.fetch, this);
    this.on(Object.keys(this.defaults).map(function(key) {
      if (_.contains([ 'metrics', 'axes' ], key)) {
        return '';
      }
      return 'change:' + key;
    }).join(' '), function(event) {
      this.trigger("change:scope");
    }, this);
  },

  updateURL: function(a, b, c) {
    var self = this;
    var params = this.queryParameters();
    app.router.navigate('/performance?' + Object.keys(params).map(function(key) {
      var value = params[key];
      if (key == 'metrics' || key == 'axes') {
        return value.map(function(element) {
          return key + '[]=' + element;
        }).join('&');
      } else {
        return key + '=' + params[key];
      }
    }).join('&'), { replace: true });
  },

  queryParameters: function() {
    var params = {};
    for (var key in this.defaults) {
      var value = this.get(key);
      if (value != null && value != '') {
        switch (key) {
          case 'start_date':
          case 'end_date':
            value = value.format('YYYYMMDD');
            break;
          default:
            break;
        }
        params[key] = value;
      }
    }
    return params;
  },

  setQuery: function(query) {
    for (var key in query) {
      if (!(_.contains(Object.keys(this.defaults), key))) {
        delete query[key];
        continue;
      }
      switch (key) {
        case 'start_date':
        case 'end_date':
          query[key] = moment(query[key], 'YYYYMMDD');
          break;
        default:
          break;
      }
    }
    this.set(query);
  },

  titleForMetric: function(metric_path) {
    var title = this.all_metrics;
    for (var metric_key of metric_path.split(".")) {
      title = title[metric_key];
    }
    return title;
  },

  sync: function (method, model, options) {
    var params = this.queryParameters();
    params['metrics'] = [];
    params['axes'] = [];
    params['suggestions'] = Object.keys(this.filters);
    options.data = params;
    return Backbone.sync.apply(this, [method, model, options]);
  },

  parse: function(data) {
    return { suggestions: data.result[0].performance.suggestions };
  },

});
