package com.cuubas;

public class StatusMessage {
  public static int OK = 1;
  public static int ERROR = 0;

  private String message;
  private int code;

  public StatusMessage(String msg, int code) {
    this.message = msg;
    this.code = code;
  }
}