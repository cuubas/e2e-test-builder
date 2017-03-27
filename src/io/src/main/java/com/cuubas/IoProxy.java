package com.cuubas;

import javafx.stage.*;
import javafx.application.*;
import java.io.File;

import java.nio.file.Files;

import com.google.gson.Gson;
import com.google.gson.internal.LinkedTreeMap;

public class IoProxy extends Application {

  public void start(Stage stage) throws Exception {
    try {
      LinkedTreeMap<String, Object> input = read();
      String op = (String) input.get("op");
      if ("open".equals(op)) {
        openFile(stage, (String) input.get("path"));
      } else {
        write(new ErrorMessage("unknown op:" + op));
      }
    } catch (Exception ex) {
      write(ex.toString());
    }
  }

  public void openFile(Stage stage, String name) throws Exception {
    FileChooser fileChooser = new FileChooser();
    if (name != null && !name.isEmpty()) {
      fileChooser.setInitialDirectory(new File(name).getParentFile());
    }
    final File selectedFile = fileChooser.showOpenDialog(stage);

    if (selectedFile != null) {
      write(new FileMessage(selectedFile));
    } else {
      write(new ErrorMessage("no file selected"));
    }
    System.exit(0);
  }

  public LinkedTreeMap read() throws Exception {
    byte[] lengthByte = new byte[4];
    System.in.read(lengthByte, 0, 4);
    int length = getInt(lengthByte);

    //Read the message into byte[] c:
    byte[] input = new byte[length];
    System.in.read(input, 0, length);
    Gson gson = new Gson();
    LinkedTreeMap result = gson.fromJson(new String(input), LinkedTreeMap.class);

    return result;
  }

  public static void main(String[] args) {
    launch(args);
  }

  public void write(Object output) throws Exception {
    Gson gson = new Gson();
    String result = gson.toJson(output);

    System.out.write(getBytes(result.length()));
    System.out.write(result.getBytes());
  }

  public byte[] getBytes(int length) {
    byte[] bytes = new byte[4];
    bytes[0] = (byte) (length & 0xFF);
    bytes[1] = (byte) ((length >> 8) & 0xFF);
    bytes[2] = (byte) ((length >> 16) & 0xFF);
    bytes[3] = (byte) ((length >> 24) & 0xFF);
    return bytes;
  }

  public int getInt(byte[] bytes) {
    return (bytes[3] << 24) & 0xff000000 | (bytes[2] << 16) & 0x00ff0000 | (bytes[1] << 8) & 0x0000ff00
        | (bytes[0] << 0) & 0x000000ff;
  }

}
