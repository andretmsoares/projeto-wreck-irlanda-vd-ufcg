const COLORS = [
  '#1c2b3a', '#9c3f2c', '#2c6664', '#a4791f', '#5b4636',
  '#6b7a8f', '#7a3b46', '#3f6b3f', '#8a5a1f', '#4a4e69',
  '#734c3a', '#2f5d73', '#8c5b8f', '#5c6b2f', '#a15843',
  '#3a5a78', '#7c6b1f', '#5e3a5c', '#2f4d3a', '#8a3f5a'
];
const colorOf = {};
DATA.classifications.forEach((c,i)=> colorOf[c] = COLORS[i % COLORS.length]);

let active = new Set(DATA.defaultClassifications);

const chartDom = document.getElementById('chart');
const chart = echarts.init(chartDom, null, {renderer:'svg'});

function buildSeries(){
  return DATA.classifications.filter(c=>active.has(c)).map(c=>({
    name:c,
    type:'line',
    showSymbol:false,
    symbol:'circle',
    symbolSize:5,
    smooth:0.15,
    lineStyle:{width:2, color:colorOf[c]},
    itemStyle:{color:colorOf[c]},
    emphasis:{focus:'series', lineStyle:{width:3.5}},
    data: DATA.series[c],
    _cls:c
  }));
}

function option(){
  return {
    backgroundColor:'transparent',
    textStyle:{fontFamily:'Georgia, serif', color:'#1c2b3a'},
    grid:{left:52, right:26, top:20, bottom:78},
    xAxis:{
      type:'category',
      data:DATA.years,
      boundaryGap:false,
      axisLine:{lineStyle:{color:'#b8ab86'}},
      axisTick:{alignWithLabel:true, lineStyle:{color:'#b8ab86'}},
      axisLabel:{color:'#6c7d8c', fontSize:11, fontFamily:'ui-monospace, monospace'},
      splitLine:{show:false}
    },
    yAxis:{
      type:'value',
      name:'Nº de naufrágios',
      nameTextStyle:{color:'#6c7d8c', fontSize:11, fontFamily:'ui-monospace, monospace'},
      axisLine:{show:false},
      axisTick:{show:false},
      axisLabel:{color:'#6c7d8c', fontSize:11, fontFamily:'ui-monospace, monospace'},
      splitLine:{lineStyle:{color:'#ddd2b2', type:'dashed'}}
    },
    axisPointer:{link:[{xAxisIndex:'all'}]},
    tooltip:{
      trigger:'axis',
      backgroundColor:'#1c2b3a',
      borderWidth:0,
      textStyle:{color:'#ece3ce', fontSize:12, fontFamily:'Georgia, serif'},
      extraCssText:'max-width:320px; white-space:normal; line-height:1.5; box-shadow:0 6px 18px rgba(0,0,0,.25);',
      axisPointer:{type:'line', lineStyle:{color:'#a4791f', width:1}},
      formatter:function(params){
        if(!params.length) return '';
        const year = params[0].axisValueLabel || params[0].name;
        let out = '<div style="font-family:ui-monospace,monospace;color:#c99a30;letter-spacing:.06em;margin-bottom:6px;">ANO '+year+'</div>';
        params.filter(p=>p.data>0).sort((a,b)=>b.data-a.data).forEach(p=>{
          out += '<div style="margin-bottom:5px;"><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:'+p.color+';margin-right:6px;"></span><b>'+p.seriesName+'</b> — '+p.data+' registro(s)';
          const key = p.seriesName+'|'+year;
          const ex = DATA.examples[key];
          if(ex && ex.length){
            out += '<div style="font-size:11px;color:#c9bfa8;margin-left:14px;">'+ex.slice(0,2).join(' · ')+'</div>';
          }
          out += '</div>';
        });
        if(params.every(p=>p.data===0)) out += '<div style="color:#c9bfa8;">Nenhum registro visível neste ano.</div>';
        return out;
      }
    },
    legend:{show:false},
    dataZoom:[
      {type:'inside', start:60, end:100},
      {
        type:'slider', bottom:14, height:26,
        borderColor:'#b8ab86',
        fillerColor:'rgba(164,121,31,0.18)',
        handleStyle:{color:'#a4791f'},
        dataBackground:{lineStyle:{color:'#b8ab86'},areaStyle:{color:'rgba(184,171,134,0.25)'}},
        selectedDataBackground:{lineStyle:{color:'#a4791f'},areaStyle:{color:'rgba(164,121,31,0.25)'}},
        textStyle:{color:'#6c7d8c', fontFamily:'ui-monospace, monospace', fontSize:10},
        start:60, end:100
      }
    ],
    series: buildSeries(),
    markAreaSeriesInject:true
  };
}

function withWarMarkers(opt){
  const series = opt.series;
  if(series.length){
    series[0].markArea = {
      silent:true,
      itemStyle:{color:'rgba(156,63,44,0.08)'},
      label:{show:false},
      data:[
        [{xAxis: yearIndex(1914)}, {xAxis: yearIndex(1918)}],
        [{xAxis: yearIndex(1939)}, {xAxis: yearIndex(1945)}]
      ]
    };
  }
  return opt;
}
function yearIndex(y){
  const idx = DATA.years.indexOf(y);
  return idx === -1 ? 0 : idx;
}

function render(){
  chart.setOption(withWarMarkers(option()), true);
  updateRangeLabel();
}

function updateRangeLabel(){
  document.getElementById('rangeLabel').textContent =
    DATA.years[0] + '–' + DATA.years[DATA.years.length-1] + ' · ' + active.size + ' TIPO(S) SELECIONADO(S)';
}

function buildChipList(){
  const list = document.getElementById('chipList');
  list.innerHTML = '';
  DATA.classifications.forEach(c=>{
    const el = document.createElement('div');
    el.className = 'chip' + (active.has(c) ? ' active' : '');
    el.innerHTML = '<span class="swatch" style="background:'+colorOf[c]+'"></span>' +
                    '<span class="name">'+c+'</span>' +
                    '<span class="count">'+DATA.totalCounts[c]+'</span>';
    el.addEventListener('click', ()=>{
      if(active.has(c)){ active.delete(c); } else { active.add(c); }
      buildChipList();
      render();
    });
    list.appendChild(el);
  });
}

document.getElementById('resetBtn').addEventListener('click', ()=>{
  active = new Set(DATA.defaultClassifications);
  buildChipList(); render();
});
document.getElementById('allBtn').addEventListener('click', ()=>{
  active = new Set(DATA.classifications);
  buildChipList(); render();
});

buildChipList();
render();
window.addEventListener('resize', ()=>chart.resize());
