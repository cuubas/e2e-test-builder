@echo OFF

IF "%JAVA_HOME%" == "" (
  java -jar ioproxy-1.0.jar %*
) ELSE (
  "%JAVA_HOME%\bin\java.exe" -jar ioproxy-1.0.jar %*
)
