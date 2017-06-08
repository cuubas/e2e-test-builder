package com.cuubas;

public class AboutMessage extends StatusMessage {
  private int version;
  
  public AboutMessage(int version) {
    super(OK);
    this.version = version;
  }
}