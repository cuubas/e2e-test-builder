package com.cuubas;

public class AboutMessage {
  private int version;
  private int code = StatusMessage.OK;
  
  public AboutMessage(int version) {
    this.version = version;
  }
}