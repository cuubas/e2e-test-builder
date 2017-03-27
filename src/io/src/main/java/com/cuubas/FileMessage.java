package com.cuubas;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;

public class FileMessage {
  private String path;
  private String data;

  public FileMessage(File file) throws IOException {
    this.path = file.getAbsolutePath();
    this.data = new String(Files.readAllBytes(file.toPath()));
  }
}