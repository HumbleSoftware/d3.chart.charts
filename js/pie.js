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
    this.color = options.color || d3.scale.category10();

    var pie = this.pie = d3.layout.pie()
      .sort(null)
      .value(function (d) { return d.value; });

    // Slices layer:
    var slices = this.base.append('g').attr('class', 'slices');
    this.layer('slices', slices, {
      dataBind : function (data) {
        data = chart.pie(data).map(function (d) {
          d.startAngle = d.startAngle || 0;
          d.endAngle = d.endAngle || 0;
          return d;
        });
        return this.selectAll('g.slice').data(data);
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
    return data;
  }
});
