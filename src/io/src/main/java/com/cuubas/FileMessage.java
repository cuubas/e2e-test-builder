package com.cuubas;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;

public class FileMessage extends StatusMessage {
  private String path;
  private String data;

  public FileMessage(File file, boolean sendData) throws IOException {
    super(null, OK);
    this.path = file.getAbsolutePath();
    if (sendData) {
      this.data = new String(Files.readAllBytes(file.toPath()));
    }
  }
}