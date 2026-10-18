module hu.otilsoft.progresstracker {
    requires java.sql;
    requires io.javalin;
    requires kotlin.stdlib;
    requires com.fasterxml.jackson.kotlin;
    requires com.fasterxml.jackson.databind;
    opens hu.otilsoft.progresstracker to com.fasterxml.jackson.databind, kotlin.reflect;
}
