import Ember from 'ember';
import { setDefaultHighChartOptions } from '../utils/option-loader';
import getOwner from 'ember-getowner-polyfill';

const {
  Component,
  computed,
  get,
  set,
  merge,
  on,
  run,
  $
  } = Ember;

export default Component.extend({
  classNames: ['highcharts-wrapper'],
  content: undefined,
  mode: undefined,
  chartOptions: undefined,
  chart: null,
  theme: undefined,
  callback: undefined,

  buildOptions: computed('chartOptions', 'content.[]', function () {
    let chartOptions = $.extend(true, {}, get(this, 'theme'), get(this, 'chartOptions'));
    let chartContent = get(this, 'content.length') ? get(this, 'content') : [{
      id: 'noData',
      data: 0,
      color: '#aaaaaa'
    }];

    let defaults = {series: chartContent};

    return merge(defaults, chartOptions);
  }),

  didReceiveAttrs() {
    this._super(...arguments);

    if (!(get(this, 'content') && get(this, 'chart'))) {
      return;
    }

    let chart = get(this, 'chart');
    let noData = chart.get('noData');

    if (noData != null) {
      noData.remove();
    }

    let numToRemove = chart.series.length - get(this, 'content').length;

    for (let i = numToRemove; i > 0; i--) {

      let lastIndex = chart.series.length - 1;

      if (chart.series[lastIndex]) {
        chart.series[lastIndex].remove(false);
      }

    }

    get(this, 'content').forEach((series, idx) => {

      if (chart.series[idx]) {
        return chart.series[idx].setData(series.data, false);
      } else {
        return chart.addSeries(series, false);
      }
    });

    return chart.redraw();

  },

  drawAfterRender() {
    run.scheduleOnce('afterRender', this, 'draw');
  },

  draw() {
    let completeChartOptions = [get(this, 'buildOptions'), get(this, 'callback')];
    let mode = get(this, 'mode');

    if (typeof mode === 'string' && !!mode) {
      completeChartOptions.unshift(mode);
    }

    let $element = this.$();
    if ($element) {
      let chart = $element.highcharts.apply($element, completeChartOptions).highcharts();
      set(this, 'chart', chart);
    }
  },

  enableChartRotate(){
    let chart = get(this, 'chart');

    // Add mouse events for rotation
    $(chart.container).bind('mousedown.hc touchstart.hc', function (eStart) {
      eStart = chart.pointer.normalize(eStart);

      var posX = eStart.pageX,
        posY = eStart.pageY,
        alpha = chart.options.chart.options3d.alpha,
        beta = chart.options.chart.options3d.beta,
        newAlpha,
        newBeta,
        sensitivity = 5; // lower is more sensitive

      $(document).bind({
        'mousemove.hc touchdrag.hc': function (e) {
          // Run beta
          newBeta = beta + (posX - e.pageX) / sensitivity;
          chart.options.chart.options3d.beta = newBeta;

          // Run alpha
          newAlpha = alpha + (e.pageY - posY) / sensitivity;
          chart.options.chart.options3d.alpha = newAlpha;

          chart.redraw(false);
        },
        'mouseup touchend': function () {
          $(document).unbind('.hc');
        }
      });
    });

  },

  enableChartRotateAfterRender(){
    let chartOptions = get(this, 'buildOptions');
    if (chartOptions.enableChartRotate) {
      run.scheduleOnce('afterRender', this, 'enableChartRotate');
    }
  },

  _renderChart: on('didInsertElement', function () {
    this.drawAfterRender();
    this.enableChartRotateAfterRender();
    setDefaultHighChartOptions(getOwner(this));
  }),

  _destroyChart: on('willDestroyElement', function () {
    if (get(this, 'chart')) {
      get(this, 'chart').destroy();
    }
  })
});
