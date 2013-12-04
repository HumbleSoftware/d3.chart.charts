d3.chart("Histogram", {

  initialize: function(options) {

    options = options || {};

    var chart = window.chart = this;

    this.color = d3.scale.linear();
    this.stack = d3.layout.stack();
    this.x = d3.scale.linear();
    this.y = d3.scale.linear()
      .domain([0, 100]);

    var barPadding = 8;

    this.base
      .attr("class", "chart");

    // Bars layer:
    var bars = this.base.append("g")
       .attr('class', 'bars');
    this.layer("bars", bars, {
      dataBind : function (data) {
        return this.selectAll("g")
            .data(data)
          .enter().append("g")
            .attr("fill", function (d, i) {
              return chart.color(i);
            })
          .selectAll("rect")
            .data(function (d) { return d; });
      },
      insert : function () {
        return this.insert("rect");
      },
      events : {
        enter : function () {
          var barWidth = Math.abs(chart.x(0) - chart.x(1)) - barPadding;
          this
            .attr("x", function(d, i) { return chart.x(d.x) - .5 - barWidth / 2; })
            .attr("y", function(d) { return chart.y(d.y0 + d.y) - .5; })
            .attr("width", barWidth)
            .attr("height", function(d) { return chart.y(d.y0) - chart.y(d.y0 + d.y); });
        }
      }
    });

    // Ticks layer:
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
          var xAxis = d3.svg.axis()
            .scale(chart.x)
            .tickSize(0)
            .tickPadding(6)
            .orient('bottom');
          this
            .attr('class', 'x axis')
            .attr('transform', 'translate(0,' + (chart.height() - chart.padding()[2]) + ')')
            .call(xAxis);
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
          var brush = d3.svg.brush()
            .x(chart.x);
          this.call(brush);
          this.selectAll('rect').attr('height', chart.height());
          brush.on('brush.chart', function () {
            brush.extent(brush.extent().map(function (d, i) {
              return Math.round(d) + i - 0.5 - (i - 1 | i) * chart.x.invert(chart.x(0) + barPadding / 2);
            }));
            layer.call(brush);
          });
        }
      }

    });

    // Constructor options:
    this.width(options.width || 600);
    this.height(options.height || 120);
    this.padding(options.padding || [0, 0, 20, 0]);

  },

  width: function(newWidth) {
    if (!arguments.length) {
      return this.w;
    }
    this.w = newWidth;
    this.x.range([0, this.w]);
    this.base.attr("width", this.w);
    return this;
  },

  height: function(newHeight) {
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

  transform: function(data) {
    var padding = this.padding();
    this.stack(data);
    this.yStackMax = d3.max(data, function (layer) { return d3.max(layer, function (d) { return d.y0 + d.y; }); });

    this.color
      .domain([0, data.length - 1])
      .range(["#556", "#aad"]);

    this.x
      .domain([data[0][0].x - 0.5, data[0][data[0].length - 1].x + 0.5])
      .range([0, this.width()]);

    this.y
      .domain([0, this.yStackMax])
      .range([this.height() - this.padding()[2] - this.padding()[0], 0]);

    return data;
  }

});

