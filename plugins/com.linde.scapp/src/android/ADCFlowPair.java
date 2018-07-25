package com.linde.scapp;

public class ADCFlowPair
{
    private int adc;

    private int flow;

    public ADCFlowPair(int adc, int flow)
    {
        this.adc = adc;
        this.flow = flow;
    }

    public int getAdc()
    {
        return adc;
    }

    public int getFlow()
    {
        return flow;
    }
}
