class Main {
  public static void main(String[] args) {
    int x = 6;
    int y = 4;
    System.out.println(x + " " + y);
    x = ++x + y-- - --y;
    System.out.println(x + " " + y);
    y = x++ + ++y - x--;
    System.out.println(x + " " + y);
    x = ++x - --x + y++ - --y + x--;
    System.out.println(x + " " + y);
    System.out.println(++x + y-- - x++ + --y);
    System.out.println(x + " " + y);
  }
}
