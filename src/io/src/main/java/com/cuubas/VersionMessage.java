package com.cuubas;

public class VersionMessage extends StatusMessage {
  private int version;
  public VersionMessage(int version) {
    super("", StatusMessage.OK);
    this.version = version;
  }
}