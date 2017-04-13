package com.cuubas;

import javafx.stage.*;
import javafx.application.*;
import java.io.File;
import java.nio.file.Files;

import com.google.gson.Gson;
import com.google.gson.internal.LinkedTreeMap;

public class IoProxy extends Application {
  public static int VERSION = 1;

  public void start(Stage stage) throws Exception {
    try {
      LinkedTreeMap<String, Object> input = read();
      String op = (String) input.get("op");
      if ("open".equals(op)) {
        openFile(stage, input);
      } else if ("write".equals(op)) {
        writeFile(stage, input);
      } else if ("read".equals(op)) {
        readFile(input);
      } else if ("about".equals(op)) {
        write(new AboutMessage(VERSION));
      } else {
        write(new StatusMessage("unknown op:" + op, StatusMessage.ERROR));
      }
    } catch (Exception ex) {
      write(new StatusMessage("exception:" + ex.toString(), StatusMessage.ERROR));
    }
    System.exit(0);
  }

  public void openFile(Stage stage, LinkedTreeMap options) throws Exception {
    FileChooser fileChooser = new FileChooser();
    String name = (String) options.get("lastPath");
    if (name != null && !name.isEmpty()) {
      fileChooser.setInitialDirectory(new File(name).getParentFile());
    }
    final File selectedFile = fileChooser.showOpenDialog(stage);

    if (selectedFile != null) {
      write(new FileMessage(selectedFile, true));
    } else {
      write(new StatusMessage("no file selected", StatusMessage.ERROR));
    }
  }

  public void readFile(LinkedTreeMap options) throws Exception {
    File file = new File((String) options.get("path"));
    write(new FileMessage(file, true));
  }

  public void writeFile(Stage stage, LinkedTreeMap options) throws Exception {
    File file;
    String data = (String) options.get("data");
    if (!options.containsKey("path")) {
      FileChooser fileChooser = new FileChooser();
      String name = (String) options.get("lastPath");
      if (name != null && !name.isEmpty()) {
        fileChooser.setInitialDirectory(new File(name).getParentFile());
        fileChooser.setInitialFileName(new File(name).getName());
      }
      file = fileChooser.showSaveDialog(stage);
    } else {
      file = new File((String) options.get("path"));
    }
    if (file != null) {
      Files.write(file.toPath(), data.getBytes());
      write(new FileMessage(file, false));
    } else {
      write(new StatusMessage("no file selected", StatusMessage.ERROR));
    }
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
