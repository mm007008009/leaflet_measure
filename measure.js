    var active = true;//标记是否激活
	var pointArray =[];//坐标
	var markerArray =[];//marker集合
	var polyLineArray=[];//polyline集合
	var measureIndex=0;//用于分次的索引
	var measureArray=[];//保存每次的测量结果,元素为要素图层组
	var tooltipLayer =L.featureGroup().addTo(mymap);//工具条临时组
	var tooltipPLayer=L.featureGroup().addTo(mymap);//工具条永久组
	var tempLineLayer = L.featureGroup().addTo(mymap);//保存临时线的组
		
	//点、线样式
	let mEndStyleOps = {//终点样式
		radius:9,
		fill:true,
		fillColor:"#70dc70",
		fillOpacity:1,
	};
	let mNorStyleOps = {//普通点样式
		radius:6,
		color:"#a0b070",
		fill:true,
		fillColor:"#a0cc70",
		fillOpacity:0.8,
	};
	let lNorStyleOps = {//普通线样式
		color:"#c9c804",
		opacity:0.6,
		};
	let lEndStyleOps = {//终线样式
		color:"#a9c804",
		weight:4,
		opacity:0.9,
	};
		
	let tooltipOpsP = {//永久标记样式
		permanent:true,
		direction:"right",
		interactive:true,
	};
	let tooltipOpsT = {//临时标记样式
		permanent:false,
		direction:"right"
	};
	
	//初始化两个点，可不要
	pointArray.push(L.latLng(25, 102));
	pointArray.push(L.latLng(40, 116));
	
	//第一层
    resultLayer = L.featureGroup().addTo(mymap);
	measureArray.push(resultLayer);
    measureDistance();
	
	//根据点集合重绘，并计算距离，并显示最终popup
    function measureDistance(isEnding) {
		
		//点操作
		for(let i=0;i<pointArray.length;i++)
		{
			let p ;
			if(isEnding&&(i==0||i==pointArray.length-1)){
				p= L.circleMarker(pointArray[i],mEndStyleOps);//L.marker(pointArray[i]);
			}
			else{
				p= L.circleMarker(pointArray[i],mNorStyleOps);//L.marker(pointArray[i]);
			}
			
			markerArray.push(p);
			//本次测量加入单点。这行有时会导致双击事件无法被触发。可以考虑把这行放入后面执行
			setTimeout(function(){
				measureArray[measureIndex].addLayer(p);
			},100); 
		}
		
		let allLength=0;///计算总长
		for(let i=0;i<pointArray.length-1;i++)
		{
			//加入数组，加入图层组
			let l;
			if(isEnding){
				l=L.polyline([pointArray[i],pointArray[i+1]],lEndStyleOps);
			}
			else{
				l= L.polyline([pointArray[i],pointArray[i+1]],lNorStyleOps);
			}
			
			polyLineArray.push(l);
			//本次测量加入单线。
			setTimeout(function(){
				measureArray[measureIndex].addLayer(l);
			},100); 
			
			//前端实时计算距离
			allLength+=mymap.distance(pointArray[i],pointArray[i+1]);
			
			let alKM = (allLength/1000)+"";
			alKM = alKM.substr(0,alKM.indexOf(".")+3);
			
				
			let tooltip;

			
			//只添加最后一个提示
			if(isEnding)
			{
				if(i==pointArray.length-2)
				{
					let content = "总长： " + alKM + "  km";
					clearTooltipGroup();//清理掉之前临时的Tooltip
					tooltip= L.tooltip(tooltipOpsP);//创建永久Tooltip
					tooltip.setContent(content);
					tooltip.setLatLng(markerArray[i+1].getLatLng());
					tooltip.options.offset=L.point(10,0);
					tooltipPLayer.addLayer(tooltip);
					
					let errorIcon = L.icon({
					iconUrl: 'error.png',
					iconSize:     [20,20], // size of the icon
					iconAnchor:   [-15, -20], // 位置设置很奇怪
					});
					
					//删除的标签
					let errorMarker = L.marker(markerArray[i+1].getLatLng(),{icon:errorIcon});
					tooltipPLayer.addLayer(errorMarker);
					
					//绑定点击事件，
					errorMarker.on("click",function(e){
						let ll = this.getLatLng();//通过位置查找
						//删除标记层
						tooltipPLayer.eachLayer(function(layer){
							if(ll==layer.getLatLng())
							{
								layer.remove();
							}
						});
						//删除点线层
						for(let i=0;i<measureArray.length;i++)
						{
							//每次测量都放至于数组中的一个元素中
							measureArray[i].eachLayer(function(layer,index){
								
								if(layer.getLatLng&&(ll==layer.getLatLng()))
								{	
									mymap.removeLayer(measureArray[i]);
									measureArray.splice(i,1);
									measureIndex--;
									return;
								}
							});
						}
						
					});
					
				}
				
			}
			else{
				//普通的临时标记
				let content = "总长： " + alKM + "  km&nbsp&nbsp&nbsp&nbsp";
				tooltip= L.tooltip(tooltipOpsT);
				tooltip.setContent(content);
				tooltip.setLatLng(markerArray[i+1].getLatLng());
				tooltip.options.offset=L.point(10,0);
				tooltipLayer.addLayer(tooltip);
				//tooltip.addTo(map);
			}
		}

    }
	
	
	//清理临时线组
	function clearTempLineGroup(){
		tempLineLayer.clearLayers();
	}
	
	//清理临时tooltip
	function clearTooltipGroup(){
		tooltipLayer.clearLayers();
	}
	//清理永久tooltip
	function clearTooltipPermGroup(index){
		if(index)
		{
			tooltipPLayer.clearLayers();
		}
		else{
			tooltipPLayer.clearLayers();
		}
	}
	
	
	//清理测量数组里指定图层组
	function clearGroup(mI){
		measureArray[mI].clearLayers();
	}
	
	//删除全部,清空临时组
	function removeAllGroups(){
		for(let i=0;i<measureArray.length;i++)
		{
			mymap.removeLayer(measureArray[i]);
		}
		
		clearTempLineGroup();
		clearTooltipGroup();
		clearTooltipPermGroup();
	}
	
		mymap.on("click",function(e){
			if(!active)
				return;
			pointArray.push(e.latlng);
			
			markerArray=[];
			polyLineArray=[];
			
			clearGroup(measureIndex);
			measureDistance();
			console.log("单击");
		});
	
		mymap.on("dblclick",function(e){
			if(!active)
				return;
			//抵消单击效果
			//pointArray.pop();
			

			
			deactiveMeasure();

		});
		
		mymap.on("mousemove",function(e){
			
			if(!active)
				return;
			if(pointArray.length<1)
				return;
			
			tempLineLayer.clearLayers();
			tempLineLayer.addLayer(L.polyline([pointArray[pointArray.length-1],e.latlng],lNorStyleOps));
		});
		
		

	
	document.getElementById('b').onclick=activeMeasure;
	
	document.getElementById('e').onclick=deactiveMeasure;
	
	document.getElementById("c").onclick = removeAllGroups;

	
	function activeMeasure(){
		active=true;
		//分次索引变化
		measureIndex++;
		//新组入图
		measureArray.push(L.featureGroup().addTo(mymap));
	}
	
	function deactiveMeasure(){
		//
		if(!active)
			return;
		//清理要素缓冲
		markerArray=[];
		polyLineArray=[];
		//删除指定图层组内容
		clearGroup(measureIndex);
		//删除临时线
		clearTempLineGroup();
		//删除全部tooltip
		clearTooltipGroup();
		//重新生成
		measureDistance(true);
		//清空点缓冲
		pointArray=[];
		//激活状态变更。
		active=false;

		
	}