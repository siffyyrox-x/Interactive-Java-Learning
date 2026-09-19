class Main {
  public static void main(String[] args) {
    boolean a, b, c, d, e;
    a = (15 % 4 == 3) && true;
    b = (a || false) && !(8 / 3 == 3);
    c = !b || (a && true);
    d = (a && b) || (c && !false);
    e = (d && !b) || (a && c);
    System.out.println(a + " " + b);
    System.out.println(c + " " + d);
    System.out.println(e);
    System.out.println((a || b) && (d && !e));
  }
}
