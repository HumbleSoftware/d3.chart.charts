d3.chart("Histogram", {

  initialize: function (options) {

    options = options || {};

    var chart = this;

    this.color = options.color || d3.scale.category10();
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
        'enter' : function () {
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
            .duration(chart.duration())
            .call(positionBar.call(this));
        }
      }
    });

    // Ticks layer:
    var xAxis = this.xAxis = d3.svg.axis();
    if (options.tickValues) xAxis.tickValues(options.tickValues);
    if (options.tickFormat) xAxis.tickFormat(options.tickFormat);
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

          this
            .attr('class', 'x axis')
            .attr('transform', 'translate(0,' + (chart.height() - chart.padding()[2]) + ')')
            .call(xAxis)
          this.selectAll('g')
            .attr('transform', function (d) {
              return 'translate(' + (xAxis.scale()(d) + chart.barWidth() / 2) + ',0)';
            });
        },
        update : function () {
          this.call(chart.xAxis);
          this.call(centerTicks);
        }
      }
    });
    function centerTicks () {
      this.selectAll('g')
        .attr('transform', function (d, i) {
          return 'translate(' + (xAxis.scale()(d) + chart.barWidth() / 2) + ',0)';
        });
    }

    // Constructor options:
    this.width(options.width || 600);
    this.height(options.height || 120);
    this.padding(options.padding || [0, 0, 20, 0]);

    if (options.configure) options.configure(this);

    // Brush:
    // TODO factor this out into either a layer or chart mixin.
    var gBrush = this.gBrush = this.base.append('g').attr('class', 'brush');
    var brush = this.brush = d3.svg.brush().x(this.x);
    gBrush.call(brush);
    var oldExtent = brush.extent();
    gBrush.selectAll('rect').attr('height', chart.height());
    brush.on('brush.chart', function () {
      var extent = brush.extent();
      var a = Math.round(extent[0]);
      var b = Math.round(a + Math.round(extent[1] - extent[0]));
      extent = [a, b];
      brush.extent(extent);
      gBrush.call(brush);
      // Trigger brush change event:
      if (oldExtent && (oldExtent[0] !== extent[0] || oldExtent[1] !== extent[1])) {
        chart.trigger('select', extent[0] !== extent[1] ? extent : null);
      }
      oldExtent = extent;
    });

    // Brush layer:
    /*
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
          var brush = d3.svg.brush();
          brush.x(chart.x);
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
    */
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
  duration : function (duration) {
    if (!arguments.length) {
      return this._duration;
    }
    this._duration = duration;
    return this;
  },
  padding : function (newPadding) {
    if (!arguments.length) {
      return this.p;
    }
    this.p = newPadding;
    return this;
  },
  selection : function (extent) {
    var brush = this.brush;
    if (!arguments.length) {
      return brush.extent();
    }
    brush.extent(extent || [315, 315]);
    this.gBrush.call(brush);
    return this;
  },
  transform : function (config) {
    var data = config.data || config;
    var padding = this.padding();
    this.stack(data);
    var yStackMax = d3.max(data, function (layer) { return d3.max(layer, function (d) { return d.y0 + d.y; }); });

    // Axes:
    var padding = this.padding();
    this.x
      .domain([data[0][0].x, data[0][data[0].length - 1].x + 1])
      .range([padding[3], this.width() - padding[1]]);

    var y = config.y;
    this.y
      .domain([0, y.max || yStackMax])
      .range([this.height() - padding[2] - padding[0], 0]);

    this.selection(this.brush.extent());

    return data;
  }
});
