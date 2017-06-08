package com.cuubas;

public class StatusMessage {
  public static int OK = 1;
  public static int ERROR = 0;

  private String message;
  private String[] stacktrace;
  private int code;

  public StatusMessage(int code) {
    this.code = code;
  }

  public StatusMessage(String msg, int code) {
    this.message = msg;
    this.code = code;
  }

  public StatusMessage(Exception exception, int code) {
    this.message = "exception:" + exception.toString();
    this.code = code;

    this.stacktrace = new String[exception.getStackTrace().length];
    int i = 0;
    for (StackTraceElement e : exception.getStackTrace()) {
      this.stacktrace[i++] = e.toString();
    }
  }
}