/**
 * Licensed under the MIT License.
 * (c) 2013 Carl Sutherland
 *
 * Inspired by various d3 examples of Mike Bostock and d3.chart examples of Irene Ros and @jugglingmike.
 */
d3.chart("Histogram", {

  initialize: function(options) {

    options = options || {};

    var chart = window.chart = this;

    this.color = d3.scale.linear();
    this.stack = d3.layout.stack();
    this.x = d3.scale.linear();
    this.y = d3.scale.linear()
      .domain([0, 100]);

    var barPadding = 1;

    this.barWidth = function () {
      return Math.abs(this.x(0) - this.x(1)) - barPadding;
    }

    this.base
      .attr("class", "chart");

    // Bars layer:
    var bars = this.base.append("g")
       .attr('class', 'bars');
    function positionBar (selection) {
      // Needs to be called with .call(this) to get the right context
      // returns closure passed into d3.selections .call method.
      var chart = this.chart();
      var barWidth = chart.barWidth();
      return function () {
        this
          .attr("x", function(d, i) { return chart.x(d.x) - 0.5; })
          .attr("y", function(d) { return chart.y(d.y0 + d.y) - .5; })
          .attr("width", barWidth)
          .attr("height", function(d) { return chart.y(d.y0) - chart.y(d.y0 + d.y); });
      };
    }
    this.layer("bars", bars, {
      dataBind : function (data) {
        return this.selectAll("g").data(data);
      },
      insert : function () {
        return this.insert("g")
          .attr('class', function (d, i) { return 'series-' + i; })
          .attr("fill", function (d, i) { return chart.color(i); });
      },
      events : {
        enter : function () {
          this.selectAll("rect")
            .data(function (d) { return d; })
            .enter().append('rect')
            .call(positionBar.call(this));
        },
        'update' : function () {
          this.selectAll("rect")
              .data(function (d) { return d; })
            .enter().append('rect')
              .call(positionBar.call(this));
        },
        'update:transition' : function () {
          this.selectAll('rect')
            .transition(500)
            .call(positionBar.call(this));
        }
      }
    });

    // Ticks layer:
    this.xAxis = d3.svg.axis()
    this.layer('ticks', this.base.append('g').attr('class', 'ticks'), {
      dataBind : function (data) {
        return this.selectAll('g')
          .data([1]);
      },
      insert : function () {
        return this.insert('g');
      },
      events : {
        enter : function () {
          var chart = this.chart();
          var xAxis = chart.xAxis
            .scale(chart.x)
            .tickSize(0)
            .tickPadding(6)
            .orient('bottom');

          // Special position for axis:
          this
            .attr('class', 'x axis')
            .attr('transform', 'translate(0,' + (chart.height() - chart.padding()[2]) + ')')
            .call(xAxis)
            .selectAll('g')
              .attr('transform', function (d) {
                return 'translate(' + (xAxis.scale()(d) + chart.barWidth() / 2) + ',0)';
              });
        }
      }
    });

    // Brush layer:
    this.layer('brush', this.base.append('g').attr('class', 'brush'), {
      dataBind : function (data) {
        return this.selectAll('g').data([1]);
      },
      insert : function () {
        return this.insert('g');
      },
      events : {
        enter : function () {
          var layer = this;
          var chart = this.chart();
          var oldExtent;
          var brush = d3.svg.brush()
            .x(chart.x);
          this.call(brush);
          this.selectAll('rect').attr('height', chart.height());
          brush.on('brush.chart', function () {
            var extent = brush.extent().map(Math.round);
            brush.extent(extent);
            layer.call(brush);
            // Trigger brush change event:
            if (oldExtent && (oldExtent[0] !== extent[0] || oldExtent[1] !== extent[1])) {
              chart.trigger('select', extent[0] !== extent[1] ? extent : null);
            }
            oldExtent = extent;
          });
        }
      }

    });

    // Constructor options:
    this.width(options.width || 600);
    this.height(options.height || 120);
    this.padding(options.padding || [0, 0, 20, 0]);

    if (options.configure) options.configure(this);
  },

  width : function(newWidth) {
    if (!arguments.length) {
      return this.w;
    }
    this.w = newWidth;
    this.x.range([0, this.w]);
    this.base.attr("width", this.w);
    return this;
  },

  height : function(newHeight) {
    if (!arguments.length) {
      return this.h;
    }
    this.h = newHeight;
    this.y.rangeRound([0, this.h]);
    this.base.attr("height", this.h);
    return this;
  },

  padding : function (newPadding) {
    if (!arguments.length) {
      return this.p;
    }
    this.p = newPadding;
    return this;
  },

  transform : function (config) {
    var data = config.data || config;
    var padding = this.padding();
    this.stack(data);
    var yStackMax = d3.max(data, function (layer) { return d3.max(layer, function (d) { return d.y0 + d.y; }); });
    this.color
      .domain([0, data.length - 1])
      .range(["#556", "#aad"]);

    // Axes:
    this.x
      .domain([data[0][0].x, data[0][data[0].length - 1].x + 1])
      .range([0, this.width()]);

    var y = config.y;
    this.y
      .domain([0, y.max || yStackMax])
      .range([this.height() - this.padding()[2] - this.padding()[0], 0]);
    return data;
  }
});
/**
 * Fake data for pie looks like:
  function getPieData () {
    return [
      {"label":"one", "value":Math.random() * 20}, 
      {"label":"two", "value":Math.random() * 50}, 
      {"label":"three", "value":Math.random() * 30}
    ];
  }
 */

d3.chart("Pie", {
  initialize : function (options) {

    options = options || {};

    var chart = this;
    this.color = d3.scale.linear();

    var pie = this.pie = d3.layout.pie()
      .sort(null)
      .value(function (d) { return d.value; });

    // Slices layer:
    var slices = this.base.append('g').attr('class', 'slices');
    this.layer('slices', slices, {
      dataBind : function (data) {
        return this.selectAll('g.slice')
          .data(chart.pie(data));
      },
      insert : function () {
        return this.append('g')
          .classed('slice', true)
          .append('path');
      },
      events : {
        enter : function () {
          var chart = this.chart();
          this
            .attr('d', chart.arc)
            .attr('fill', function (d, i) { return chart.color(i); })
            .each(function (d) { this.oldData = d; });
        },
        'update:transition' : function () {
          var chart = this.chart();
          this.select('path')
            .duration(500)
            .attrTween('d', tween);
        }
      }
    });
    function tween (d) {
      // Tween from old data to new data and update old data:
      var i = d3.interpolate(this.oldData, this.oldData = d);
      return function (t) {
        return arc(i(t));
      };
    }

    // Legend layer:
    var legend = this.base.append('g')
      .classed('legend', true)
    this.layer('legend', legend, {
      dataBind : function (data) {
        return this.selectAll('g.legend-item')
          .data(data);
      },
      insert : function () {
        var g = this.append('g').classed('legend-item', true);
        g.append('text');
        g.append('circle');
        return g;
      },
      events : {
        enter : function () {
          this.select('text')
            .attr('y', function (d, i) { return i + 'em'; })
            .attr('x', '1em')
            .text(function (d) { return d.label; });
          this.select('circle')
            .attr('cy', function (d, i) { return (i - 0.25) + 'em'; })
            .attr('cx', 0)
            .attr('r', '0.4em')
            .attr('fill', function (d, i) { return chart.color(i); });
        }
      }
    });

    // Constructor options:
    this.width(options.width || 320);
    this.height(options.height || 320);

    var radius = Math.min(this.width(), this.height()) / 2;
    legend.attr('transform', 'translate(' + radius * 2 + ',10)');
    slices.attr('transform', 'translate(' + radius + ',' + radius + ')');
    var arc = this.arc = d3.svg.arc()
      .innerRadius(radius / ((1 + Math.sqrt(5)) / 2))
      .outerRadius(radius);

    if (options.configure) options.configure(this);
  },
  width: function(newWidth) {
    if (!arguments.length) {
      return this.w;
    }
    this.w = newWidth;
    this.base.attr("width", this.w);
    return this;
  },

  height: function(newHeight) {
    if (!arguments.length) {
      return this.h;
    }
    this.h = newHeight;
    this.base.attr("height", this.h);
    return this;
  },
  transform : function (data) {
    this.color
      .domain([0, data.length - 1])
      .range(["#556", "#aad"]);
    return data;
  }
});
