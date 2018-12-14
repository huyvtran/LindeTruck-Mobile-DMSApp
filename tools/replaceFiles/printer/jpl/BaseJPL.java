package com.capgemini.printDemo.printer.jpl;


import com.capgemini.printDemo.printer.Port;

public class BaseJPL
{
	protected Port port;
	protected JPL_Param param;

	/*
	 * 构造函数
	 */
	public BaseJPL(JPL_Param param) {
		if (param.port == null)
			return;
		this.param = param;
		this.port = param.port;
	}
}
