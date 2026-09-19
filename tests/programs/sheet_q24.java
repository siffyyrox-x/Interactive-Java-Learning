class Main {
  public static void main(String[] args) {
    int a = 5;
    int b = 8;
    a = a++ + ++a - --b;
    System.out.println(a + " " + b);
    b = ++a + b-- - a++;
    System.out.println(a + " " + b);
    a = b++ - --a + ++b;
    System.out.println(a + " " + b);
    System.out.println(a++ + --b - ++a + b--);
    System.out.println(a + " " + b);
  }
}
